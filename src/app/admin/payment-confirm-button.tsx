"use client";

import { useState } from "react";

type PaymentConfirmButtonProps = {
  paymentId: string;
};

export function PaymentConfirmButton({ paymentId }: PaymentConfirmButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  async function confirmPayment() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
      method: "POST"
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "确认失败");
      return;
    }

    setDone(true);
    setMessage("已确认并发放 100 积分");
  }

  return (
    <div className="payment-action">
      <button className="button button-primary" type="button" onClick={confirmPayment} disabled={loading || done}>
        {done ? "已确认" : loading ? "确认中" : "确认到账"}
      </button>
      {message ? <span className={done ? "success-text" : "error-text"}>{message}</span> : null}
    </div>
  );
}
