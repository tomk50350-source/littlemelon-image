import { Header } from "@/components/Header";
import { PricingActions } from "./pricing-actions";

export default function PricingPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="band">
        <div className="container">
          <div className="section-title">
            <div>
              <h1>简单透明的定价</h1>
              <p className="muted">9.9 元月卡，一次性支付，不自动扣费，会员积分月底清零。</p>
            </div>
          </div>
          <div className="pricing-grid">
            <article className="card pricing-card">
              <h2>Free</h2>
              <div className="price">¥0</div>
              <p className="muted">注册后免费试运行 1 张</p>
              <p>普通队列</p>
              <p>可查看提示词图库</p>
              <p>最近 5 张历史</p>
            </article>
            <article className="card pricing-card" style={{ borderColor: "#38a169" }}>
              <span className="tag">推荐</span>
              <h2>LittleMelon Pro</h2>
              <div className="price">¥9.9</div>
              <p className="muted">100 积分 / 月</p>
              <p>1K 图片消耗 0.6 积分</p>
              <p>2K 图片消耗 1 积分</p>
              <p>4K 图片消耗 2 积分</p>
              <PricingActions />
            </article>
            <article className="card pricing-card">
              <h2>后续扩展</h2>
              <div className="price">永久包</div>
              <p className="muted">首版先不上线，避免规则复杂。</p>
              <p>永久积分充值包</p>
              <p>批量生成</p>
              <p>团队账号</p>
            </article>
          </div>
          <p className="notice" style={{ marginTop: 18 }}>
            当前版本支持站长上传微信/支付宝收款码。用户扫码后由管理员确认到账，确认后自动发放 100 积分。
          </p>
        </div>
      </main>
    </div>
  );
}
