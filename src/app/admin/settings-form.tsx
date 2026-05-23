"use client";

import { useState } from "react";

type SettingsFormProps = {
  initial: {
    baseUrl: string;
    model: string;
    maxConcurrentGenerations: number;
    hasApiKey: boolean;
    emailProvider: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpFrom: string;
    hasSmtpPassword: boolean;
    wechatQr: string;
    alipayQr: string;
    alipayAppId: string;
    alipayPublicKey: string;
    hasAlipayPrivateKey: boolean;
  };
};

export function SettingsForm({ initial }: SettingsFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [maxConcurrentGenerations, setMaxConcurrentGenerations] = useState(String(initial.maxConcurrentGenerations));
  const [emailProvider, setEmailProvider] = useState(initial.emailProvider);
  const [smtpHost, setSmtpHost] = useState(initial.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(initial.smtpPort));
  const [smtpSecure, setSmtpSecure] = useState(initial.smtpSecure);
  const [smtpUser, setSmtpUser] = useState(initial.smtpUser);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState(initial.smtpFrom);
  const [wechatQr, setWechatQr] = useState(initial.wechatQr);
  const [alipayQr, setAlipayQr] = useState(initial.alipayQr);
  const [alipayAppId, setAlipayAppId] = useState(initial.alipayAppId);
  const [alipayPrivateKey, setAlipayPrivateKey] = useState("");
  const [alipayPublicKey, setAlipayPublicKey] = useState(initial.alipayPublicKey);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        baseUrl,
        model,
        maxConcurrentGenerations: Number(maxConcurrentGenerations),
        emailProvider,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpSecure,
        smtpUser,
        smtpPassword,
        smtpFrom,
        wechatQr,
        alipayQr,
        alipayAppId,
        alipayPrivateKey,
        alipayPublicKey
      })
    });
    setLoading(false);
    setMessage(response.ok ? "配置已保存" : "保存失败，请确认你是超级管理员");
    if (response.ok) setApiKey("");
  }

  async function readQr(file: File | undefined, setter: (value: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form className="panel admin-form" onSubmit={submit}>
      <h2>生图 API 配置</h2>
      <p className="muted">API Key 不会明文回显。留空表示不修改现有 Key。</p>
      <div className="field">
        <label>API Key</label>
        <input
          className="input"
          type="password"
          value={apiKey}
          placeholder={initial.hasApiKey ? "已配置，输入新 Key 可替换" : "请输入 API Key"}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>
      <div className="field">
        <label>中转地址</label>
        <input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
      </div>
      <div className="field">
        <label>模型名</label>
        <input className="input" value={model} onChange={(event) => setModel(event.target.value)} />
      </div>
      <div className="field">
        <label>同时生成上限</label>
        <input
          className="input"
          type="number"
          min={1}
          max={20}
          value={maxConcurrentGenerations}
          onChange={(event) => setMaxConcurrentGenerations(event.target.value)}
        />
      </div>

      <div className="settings-divider" />
      <h2>邮箱登录认证</h2>
      <p className="muted">不会配置时先用“本地验证链接”。上线后建议用企业邮箱或邮件服务商的 SMTP。</p>
      <div className="field">
        <label>认证方式</label>
        <select className="select" value={emailProvider} onChange={(event) => setEmailProvider(event.target.value)}>
          <option value="dev-link">本地验证链接</option>
          <option value="smtp">SMTP 邮件发送</option>
        </select>
      </div>
      <div className="field">
        <label>SMTP Host</label>
        <input className="input" value={smtpHost} onChange={(event) => setSmtpHost(event.target.value)} />
      </div>
      <div className="control-row">
        <div className="field">
          <label>SMTP 端口</label>
          <input className="input" type="number" value={smtpPort} onChange={(event) => setSmtpPort(event.target.value)} />
        </div>
        <div className="field">
          <label>SSL/TLS</label>
          <select className="select" value={smtpSecure ? "true" : "false"} onChange={(event) => setSmtpSecure(event.target.value === "true")}>
            <option value="true">启用，常用 465</option>
            <option value="false">关闭，常用 587</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>SMTP 用户名</label>
        <input className="input" value={smtpUser} onChange={(event) => setSmtpUser(event.target.value)} />
      </div>
      <div className="field">
        <label>SMTP 密码</label>
        <input
          className="input"
          type="password"
          value={smtpPassword}
          placeholder={initial.hasSmtpPassword ? "已配置，输入新密码可替换" : "请输入 SMTP 密码"}
          onChange={(event) => setSmtpPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label>发件人</label>
        <input className="input" value={smtpFrom} onChange={(event) => setSmtpFrom(event.target.value)} />
      </div>

      <div className="settings-divider" />
      <h2>支付收款码</h2>
      <p className="muted">上传微信和支付宝收款码，用户购买月卡时会看到扫码付款页面。</p>
      <div className="qr-settings-grid">
        <div className="field">
          <label>微信收款码</label>
          <input className="input" type="file" accept="image/*" onChange={(event) => readQr(event.target.files?.[0], setWechatQr)} />
          {wechatQr ? <img className="qr-preview" src={wechatQr} alt="微信收款码" /> : null}
        </div>
        <div className="field">
          <label>支付宝收款码</label>
          <input className="input" type="file" accept="image/*" onChange={(event) => readQr(event.target.files?.[0], setAlipayQr)} />
          {alipayQr ? <img className="qr-preview" src={alipayQr} alt="支付宝收款码" /> : null}
        </div>
      </div>
      <div className="settings-divider" />
      <h2>支付宝自动回调</h2>
      <p className="muted">需要支付宝开放平台应用、HTTPS 域名、应用私钥和支付宝公钥。配置齐全后，支付宝异步通知可自动确认订单并发放积分。</p>
      <div className="field">
        <label>Alipay App ID</label>
        <input className="input" value={alipayAppId} onChange={(event) => setAlipayAppId(event.target.value)} />
      </div>
      <div className="field">
        <label>应用私钥</label>
        <textarea
          className="textarea small-textarea"
          value={alipayPrivateKey}
          placeholder={initial.hasAlipayPrivateKey ? "已配置，输入新私钥可替换" : "-----BEGIN PRIVATE KEY-----"}
          onChange={(event) => setAlipayPrivateKey(event.target.value)}
        />
      </div>
      <div className="field">
        <label>支付宝公钥</label>
        <textarea
          className="textarea small-textarea"
          value={alipayPublicKey}
          placeholder="支付宝开放平台应用公钥证书或公钥内容"
          onChange={(event) => setAlipayPublicKey(event.target.value)}
        />
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <button className="button button-primary" disabled={loading}>
        {loading ? "保存中" : "保存配置"}
      </button>
    </form>
  );
}
