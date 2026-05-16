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
};

export function PricingActions() {
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
        body: JSON.stringify({ provider })
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
        manualReview: data.checkout.manualReview
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
            <h3>月卡订单 ¥9.9</h3>
            <p className="muted">订单号：{checkout.paymentId}</p>
          </div>
          {checkout.qrImage ? (
            <img className="checkout-qr" src={checkout.qrImage} alt="收款码" />
          ) : (
            <div className="checkout-empty">待管理员上传收款码</div>
          )}
          <p>{checkout.qrText}</p>
          <p className="muted">付款后管理员在后台确认到账，系统会自动发放 100 积分。</p>
        </div>
      ) : null}
    </div>
  );
}
