import { Header } from "@/components/Header";
import { requireSuperAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getAdminSettings } from "@/lib/settings";
import { PaymentConfirmButton } from "./payment-confirm-button";
import { SettingsForm } from "./settings-form";

export default async function AdminPage() {
  const admin = await requireSuperAdmin();
  const [users, payments, generations, prompts, settings, recentPayments, recentUsers, recentGenerations, recentPrompts] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.generation.count(),
    prisma.promptGallery.count(),
    getAdminSettings(),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          select: { email: true }
        }
      }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, email: true, name: true, role: true, createdAt: true, emailVerified: true }
    }),
    prisma.generation.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { email: true } } }
    }),
    prisma.promptGallery.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, category: true, model: true, updatedAt: true }
    })
  ]);

  return (
    <div className="app-shell">
      <Header />
      <main className="band">
        <div className="container">
          {!admin ? (
            <div className="panel form-card">
              <h1>需要超级管理员权限</h1>
              <p className="muted">请使用站长账号登录后再进入后台。</p>
            </div>
          ) : (
            <div className="admin-layout">
              <div>
                <div className="section-title">
                  <div>
                    <h1>后台概览</h1>
                    <p className="muted">超级管理员：{admin.email}</p>
                  </div>
                </div>
                <div className="stat-row">
                  <a className="stat" href="#admin-users">
                    <strong>{users}</strong>
                    <span>用户</span>
                  </a>
                  <a className="stat" href="#admin-payments">
                    <strong>{payments}</strong>
                    <span>订单</span>
                  </a>
                  <a className="stat" href="#admin-generations">
                    <strong>{generations}</strong>
                    <span>生成任务</span>
                  </a>
                  <a className="stat" href="#admin-prompts">
                    <strong>{prompts}</strong>
                    <span>创意案例</span>
                  </a>
                </div>
              </div>
              <SettingsForm
                initial={{
                  baseUrl: settings.baseUrl || "",
                  model: settings.model || "gpt-image-2",
                  maxConcurrentGenerations: settings.maxConcurrentGenerations,
                  hasApiKey: Boolean(settings.apiKey),
                  emailProvider: settings.emailProvider,
                  smtpHost: settings.smtpHost || "",
                  smtpPort: settings.smtpPort || 465,
                  smtpSecure: settings.smtpSecure ?? true,
                  smtpUser: settings.smtpUser || "",
                  smtpFrom: settings.smtpFrom || "",
                  hasSmtpPassword: settings.hasSmtpPassword,
                  alipayQr: settings.alipayQr || "",
                  alipayAppId: settings.alipayAppId || "",
                  alipayPublicKey: settings.alipayPublicKey || "",
                  hasAlipayPrivateKey: settings.hasAlipayPrivateKey
                }}
              />
              <section className="panel admin-section" id="admin-users">
                <div className="section-title compact">
                  <div>
                    <h2>用户管理</h2>
                    <p className="muted">最近注册用户和邮箱验证状态。</p>
                  </div>
                </div>
                <div className="admin-table">
                  {recentUsers.map((user) => (
                    <div className="admin-table-row" key={user.id}>
                      <div>
                        <strong>{user.email}</strong>
                        <span>{user.name || "未填写昵称"}</span>
                      </div>
                      <span>{user.role}</span>
                      <span>{user.emailVerified ? "已验证" : "未验证"}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel admin-section" id="admin-payments">
                <div className="section-title compact">
                  <div>
                    <h2>支付订单确认</h2>
                    <p className="muted">用户扫码付款后，你在这里确认到账，系统会发放月卡积分。</p>
                  </div>
                </div>
                <div className="payment-list">
                  {recentPayments.length ? (
                    recentPayments.map((payment) => (
                      <article className="payment-row" key={payment.id}>
                        <div>
                          <strong>{payment.user.email}</strong>
                          <span>
                            {payment.provider === "alipay" ? "支付宝" : "测试"} · ¥
                            {(payment.amountCents / 100).toFixed(1)} · {String(payment.credits)} 积分
                          </span>
                          <small>订单号：{payment.id}</small>
                        </div>
                        <div>
                          <span className={`payment-status ${payment.status.toLowerCase()}`}>{payment.status}</span>
                          {payment.status === "PENDING" ? <PaymentConfirmButton paymentId={payment.id} /> : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="muted">暂无订单。</p>
                  )}
                </div>
              </section>
              <section className="panel admin-section" id="admin-generations">
                <div className="section-title compact">
                  <div>
                    <h2>生成任务</h2>
                    <p className="muted">最近生成记录、任务状态和扣费情况。</p>
                  </div>
                </div>
                <div className="admin-table">
                  {recentGenerations.length ? (
                    recentGenerations.map((generation) => (
                      <div className="admin-table-row" key={generation.id}>
                        <div>
                          <strong>{generation.user.email}</strong>
                          <span>{generation.prompt}</span>
                        </div>
                        <span>{generation.sizeLabel}</span>
                        <span>{generation.status}</span>
                      </div>
                    ))
                  ) : (
                    <p className="muted">暂无生成任务。</p>
                  )}
                </div>
              </section>
              <section className="panel admin-section" id="admin-prompts">
                <div className="section-title compact">
                  <div>
                    <h2>创意案例</h2>
                    <p className="muted">最近同步的 GitHub 创意案例。</p>
                  </div>
                </div>
                <div className="admin-table">
                  {recentPrompts.map((prompt) => (
                    <div className="admin-table-row" key={prompt.id}>
                      <div>
                        <strong>{prompt.title}</strong>
                        <span>{prompt.category}</span>
                      </div>
                      <span>{prompt.model}</span>
                      <span>{prompt.updatedAt.toLocaleDateString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
