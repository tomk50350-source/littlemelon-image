"use client";

import Link from "next/link";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="form-page">
      <div className="panel form-card">
        <h1>出错了</h1>
        <p className="muted">{error.message || "请稍后再试。"}</p>
        <Link className="button button-primary" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}
