import { PLUS_PLAN, type BillingPlanId } from "./constants";
import { getPlan } from "./credits";
import { getAdminSettings } from "./settings";

export type PaymentProvider = "wechat" | "alipay" | "mock";

export async function createPayment(provider: PaymentProvider, paymentId: string, planId: BillingPlanId | string = PLUS_PLAN.id) {
  const plan = getPlan(planId) ?? PLUS_PLAN;
  const price = (plan.priceCents / 100).toFixed(plan.priceCents % 100 === 0 ? 0 : 1);

  if (provider === "mock") {
    return {
      provider: "mock" as const,
      checkoutUrl: `/api/payments/${paymentId}/mock-complete`,
      qrText: `MOCK_PAY:${paymentId}:${plan.priceCents}`,
      manualReview: false
    };
  }

  const settings = await getAdminSettings();
  const qrImage = provider === "wechat" ? settings.wechatQr : settings.alipayQr;
  const providerName = provider === "wechat" ? "微信" : "支付宝";

  if (provider === "wechat") {
    return {
      provider,
      checkoutUrl: "",
      qrImage,
      qrText: qrImage ? `请扫码支付 ${price} 元，备注订单号后等待管理员确认到账。` : "管理员还没有上传微信收款码。",
      manualReview: true
    };
  }

  return {
    provider,
    checkoutUrl: "",
    qrImage,
    qrText: qrImage ? `请使用${providerName}扫码支付 ${price} 元，备注订单号后等待管理员确认到账。` : "管理员还没有上传支付宝收款码。",
    manualReview: true
  };
}
