import crypto from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import { addPaidCredits } from "./credits";
import { prisma } from "./prisma";
import { getAdminSettings } from "./settings";

export async function handleAlipayNotify(form: Record<string, string>) {
  const settings = await getAdminSettings();
  const publicKey = normalizePublicKey(settings.alipayPublicKey || "");
  if (!settings.alipayAppId || !publicKey) {
    throw new Error("支付宝自动回调尚未配置 App ID 或支付宝公钥");
  }

  if (form.app_id && form.app_id !== settings.alipayAppId) {
    throw new Error("支付宝 App ID 不匹配");
  }

  if (!verifyAlipaySign(form, publicKey)) {
    throw new Error("支付宝回调验签失败");
  }

  const paymentId = form.out_trade_no;
  const tradeStatus = form.trade_status;
  const tradeNo = form.trade_no;
  if (!paymentId || !["TRADE_SUCCESS", "TRADE_FINISHED"].includes(tradeStatus)) {
    return { ok: true, ignored: true };
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("订单不存在");

  if (payment.status === PaymentStatus.PAID) {
    return { ok: true, alreadyPaid: true };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      providerTradeNo: tradeNo || `alipay-${Date.now()}`
    }
  });
  await addPaidCredits(payment.userId, payment.id, payment.planId);

  return { ok: true };
}

function verifyAlipaySign(form: Record<string, string>, publicKey: string) {
  const sign = form.sign || "";
  const signType = (form.sign_type || "RSA2").toUpperCase();
  const payload = Object.entries(form)
    .filter(([key, value]) => key !== "sign" && key !== "sign_type" && value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const verifier = crypto.createVerify(signType === "RSA" ? "RSA-SHA1" : "RSA-SHA256");
  verifier.update(payload, "utf8");
  return verifier.verify(publicKey, sign, "base64");
}

function normalizePublicKey(key: string) {
  const clean = key.trim();
  if (!clean) return "";
  if (clean.includes("BEGIN PUBLIC KEY")) return clean;
  const body = clean.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") || clean;
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
}
