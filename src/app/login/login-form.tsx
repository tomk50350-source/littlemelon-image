"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setMessage("邮箱或密码不正确");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form className="panel form-card" onSubmit={submit}>
      <h1>登录</h1>
      <p className="muted">登录后可免费试运行 1 张，并查看最近 5 张历史。</p>
      <div className="field">
        <label>邮箱</label>
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="field">
        <label>密码</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <button className="button button-primary" disabled={loading} style={{ marginTop: 16, width: "100%" }}>
        {loading ? "登录中" : "登录"}
      </button>
      <p className="muted">
        还没有账号？ <Link href="/register">注册 LittleMelon Image</Link>
      </p>
    </form>
  );
}
