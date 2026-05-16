"use client";

import Link from "next/link";
import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "注册失败");
      setLoading(false);
      return;
    }
    setLoading(false);
    setMessage(data.verifyUrl ? `注册成功。开发测试验证链接：${data.verifyUrl}` : data.message ?? "注册成功，请查收邮箱验证邮件。");
  }

  return (
    <form className="panel form-card" onSubmit={submit}>
      <h1>注册</h1>
      <p className="muted">注册 LittleMelon Image 后立即获得 1 次免费试运行。</p>
      <div className="field">
        <label>昵称</label>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="field">
        <label>邮箱</label>
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="field">
        <label>密码</label>
        <input
          className="input"
          type="password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <button className="button button-primary" disabled={loading} style={{ marginTop: 16, width: "100%" }}>
        {loading ? "注册中" : "注册并开始"}
      </button>
      <p className="muted">
        已有账号？ <Link href="/login">去登录</Link>
      </p>
    </form>
  );
}
