import { BadgeCheck, CheckCircle2, Images, LayoutDashboard, ShieldCheck, Sparkles, Wand2, Zap } from "lucide-react";
import { Generator } from "@/components/Generator";
import { GalleryPreview } from "@/components/GalleryPreview";
import { Header } from "@/components/Header";
import { APP_CN_NAME, APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="studio-shell">
        <aside className="studio-sidebar" aria-label="主导航">
          <div className="sidebar-brand">
            <span className="brand-mark">L</span>
            <div>
              <strong>{APP_NAME}</strong>
              <span>{APP_CN_NAME}</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <a className="active" href="#generator">
              <LayoutDashboard size={18} />
              AI 生图
            </a>
            <a href="/gallery">
              <Images size={18} />
              提示词图库
            </a>
            <a href="/pricing">
              <BadgeCheck size={18} />
              会员计划
            </a>
            <a href="/history">
              <Wand2 size={18} />
              生成记录
            </a>
          </nav>
          <div className="sidebar-callout">
            <span>Pro</span>
            <strong>¥9.9 / 月</strong>
            <p>100 积分，失败自动退回。注册用户可免费试运行 1 张。</p>
          </div>
        </aside>

        <section className="studio-main">
          <div className="studio-hero">
            <div>
              <span className="eyebrow">
                <Sparkles size={15} />
                GPT-Image-2 实时创意图库
              </span>
              <h1>先看灵感作品，再生成你的图片。</h1>
              <p>
                LittleMelon Image 会同步 GitHub 开源项目里的 image2 创意案例，用户可先浏览作品，再切换到电商、AI 修图或专利线稿模板。
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="/gallery">
                  <Images size={17} />
                  浏览创意图库
                </a>
                <a className="button button-secondary" href="#generator">
                  <Wand2 size={17} />
                  进入生成工作台
                </a>
              </div>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>1K</strong>
                <span>0.6 积分</span>
              </div>
              <div>
                <strong>2K</strong>
                <span>1 积分</span>
              </div>
              <div>
                <strong>4K</strong>
                <span>2 积分</span>
              </div>
            </div>
          </div>
          <GalleryPreview />
          <Generator />
          <section className="studio-card value-section">
            <div className="section-title compact">
              <div>
                <h2>为什么用户愿意留下来</h2>
                <p className="muted">把“看案例、套模板、直接生成、下载原图、付费续用”串起来。</p>
              </div>
            </div>
            <div className="value-grid">
              <article>
                <CheckCircle2 size={22} />
                <h3>入口更专业</h3>
                <p>不泛泛做 AI 生图，首屏直接给电商、修图、专利制图三类高意图入口。</p>
              </article>
              <article>
                <Images size={22} />
                <h3>图库更像产品</h3>
                <p>用模型、标签、尺寸和分类组织案例，让用户先看效果再套提示词。</p>
              </article>
              <article>
                <ShieldCheck size={22} />
                <h3>付费规则清楚</h3>
                <p>1K/2K/4K 积分消耗清晰，失败自动退回，月卡价格明确。</p>
              </article>
              <article>
                <Zap size={22} />
                <h3>可继续运营</h3>
                <p>后台和图库表已预留，后续可以做每日案例同步、收藏和邀请奖励。</p>
              </article>
            </div>
          </section>

          <section className="studio-card pricing-strip">
            <div>
              <span className="eyebrow">LittleMelon Pro</span>
              <h2>¥9.9 / 月，100 积分。</h2>
              <p className="muted">注册免费试运行 1 张。1K 消耗 0.6 积分，2K 消耗 1 积分，4K 消耗 2 积分。</p>
            </div>
            <a className="button button-primary" href="/pricing">查看会员计划</a>
          </section>

          <section className="faq-section">
            <div className="section-title compact">
              <div>
                <h2>常见问题</h2>
                <p className="muted">把用户下单前最关心的问题放在首页底部，减少犹豫。</p>
              </div>
            </div>
            <div className="faq-grid">
              <article>
                <h3>支持 8K 吗？</h3>
                <p>不支持。首版只提供 1K、2K、4K，避免给用户错误预期。</p>
              </article>
              <article>
                <h3>生成失败会扣积分吗？</h3>
                <p>生成前会预扣，失败、超时或模型拒绝时自动退回。</p>
              </article>
              <article>
                <h3>专利图能直接提交吗？</h3>
                <p>它适合生成初稿和沟通图，正式提交前仍建议按专利代理要求校对。</p>
              </article>
              <article>
                <h3>图片能下载原图吗？</h3>
                <p>可以。生成结果和最近 5 张历史都提供原图下载入口。</p>
              </article>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
