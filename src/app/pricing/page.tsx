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
              <h1>价格</h1>
              <p className="muted">1K=1 积分，2K=2 积分，4K=4 积分。生成失败自动退回。</p>
            </div>
          </div>
          <div className="pricing-grid four">
            <article className="card pricing-card">
              <h2>Free</h2>
              <div className="price">¥0</div>
              <p className="muted">注册后 1 张 1K 免费试用</p>
              <p>参考图：0 张</p>
              <p>查看案例：未登录 60 张，登录 200 张</p>
              <p>最近 5 张历史</p>
            </article>
            <article className="card pricing-card" style={{ borderColor: "#38a169" }}>
              <span className="tag">推荐</span>
              <h2>Plus</h2>
              <div className="price">¥9.9</div>
              <p className="muted">100 积分 / 月，约 100 张 1K</p>
              <p>一次提示词最多生成 2 张</p>
              <p>参考图：最多 2 张</p>
              <p>会员收藏：最多 100 张</p>
              <PricingActions defaultPlanId="plus-990" />
            </article>
            <article className="card pricing-card">
              <h2>Pro</h2>
              <div className="price">¥99</div>
              <p className="muted">1500 积分 / 月，约 1500 张 1K</p>
              <p>一次提示词最多生成 2 张</p>
              <p>参考图：最多 3 张</p>
              <p>更适合批量电商图和修图</p>
              <PricingActions defaultPlanId="pro-9900" compact />
            </article>
            <article className="card pricing-card">
              <h2>随买随用</h2>
              <div className="price">¥0.5+</div>
              <p className="muted">不用月卡，按张购买</p>
              <p>1K：¥0.5 / 张</p>
              <p>2K：¥1 / 张</p>
              <p>4K：¥2 / 张</p>
              <PricingActions defaultPlanId="payg-1k-50" compact allowPayg />
            </article>
          </div>
          <p className="notice" style={{ marginTop: 18 }}>
            当前支持微信/支付宝收款码和管理员确认到账。支付宝官方自动回调可以接入，必须先准备支付宝开放平台应用、HTTPS 域名、应用私钥和支付宝公钥。
          </p>
        </div>
      </main>
    </div>
  );
}
