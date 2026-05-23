"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

type CheckoutState = {
  paymentId: string;
  provider: "wechat" | "alipay" | "mock";
  checkoutUrl?: string;
  qrImage?: string;
  qrText?: string;
  manualReview?: boolean;
  planName?: string;
  amountCents?: number;
};

const planOptions = [
  { id: "plus-990", label: "Plus · ¥9.9 · 100 积分" },
  { id: "pro-9900", label: "Pro · ¥99 · 1500 积分" },
  { id: "payg-1k-50", label: "1K · ¥0.5 · 1 积分" },
  { id: "payg-2k-100", label: "2K · ¥1 · 2 积分" },
  { id: "payg-4k-200", label: "4K · ¥2 · 4 积分" }
] as const;

export function PricingActions({
  defaultPlanId = "plus-990",
  allowPayg = false
}: {
  defaultPlanId?: string;
  compact?: boolean;
  allowPayg?: boolean;
}) {
  const [planId, setPlanId] = useState(defaultPlanId);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);

  async function buy(provider: "wechat" | "alipay") {
    setLoading(true);
    setMessage("");
    setCheckout(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, planId })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "创建订单失败");
        return;
      }
      const nextCheckout: CheckoutState = {
        paymentId: data.payment.id,
        provider: data.checkout.provider,
        checkoutUrl: data.checkout.checkoutUrl,
        qrImage: data.checkout.qrImage,
        qrText: data.checkout.qrText,
        manualReview: data.checkout.manualReview,
        planName: data.payment.planId,
        amountCents: data.payment.amountCents
      };

      if (nextCheckout.checkoutUrl && !nextCheckout.manualReview) {
        window.location.href = nextCheckout.checkoutUrl;
        return;
      }

      setCheckout(nextCheckout);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="field">
      {allowPayg ? (
        <select className="select" value={planId} onChange={(event) => setPlanId(event.target.value)}>
          {planOptions.slice(2).map((plan) => (
            <option value={plan.id} key={plan.id}>
              {plan.label}
            </option>
          ))}
        </select>
      ) : null}
      <button className="button button-primary" onClick={() => buy("wechat")} disabled={loading}>
        {loading ? <Loader2 size={16} /> : <CreditCard size={16} />}
        微信支付
      </button>
      <button className="button button-secondary" onClick={() => buy("alipay")} disabled={loading}>
        支付宝
      </button>
      {message ? <p className="notice">{message}</p> : null}
      {checkout ? (
        <div className="checkout-panel">
          <div>
            <span className="tag">{checkout.provider === "wechat" ? "微信扫码" : "支付宝扫码"}</span>
            <h3>订单 ¥{((checkout.amountCents ?? 990) / 100).toFixed((checkout.amountCents ?? 990) % 100 === 0 ? 0 : 1)}</h3>
            <p className="muted">订单号：{checkout.paymentId}</p>
          </div>
          {checkout.qrImage ? (
            <img className="checkout-qr" src={checkout.qrImage} alt="收款码" />
          ) : (
            <div className="checkout-empty">待管理员上传收款码</div>
          )}
          <p>{checkout.qrText}</p>
          <p className="muted">付款后管理员在后台确认到账，系统会自动发放对应积分。</p>
        </div>
      ) : null}
    </div>
  );
}
