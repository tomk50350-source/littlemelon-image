import { BadgeCheck, Images, LayoutDashboard, Sparkles, Wand2 } from "lucide-react";
import { GalleryPreview } from "@/components/GalleryPreview";
import { Generator } from "@/components/Generator";
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
              创意案例
            </a>
            <a href="/pricing">
              <BadgeCheck size={18} />
              价格
            </a>
            <a href="/history">
              <Wand2 size={18} />
              历史
            </a>
          </nav>
          <div className="sidebar-callout">
            <span>Plus</span>
            <strong>¥9.9 / 100 积分</strong>
            <p>1K=1 积分，2K=2 积分，4K=4 积分。失败自动退回。</p>
          </div>
        </aside>

        <section className="studio-main">
          <div className="studio-hero workbench-hero">
            <div>
              <span className="eyebrow">
                <Sparkles size={15} />
                GPT-Image-2
              </span>
              <h1>LittleMelon Image</h1>
              <p>电商产品图、AI 修图、专利线条图和创意图片生成。</p>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>1K</strong>
                <span>1 积分</span>
              </div>
              <div>
                <strong>2K</strong>
                <span>2 积分</span>
              </div>
              <div>
                <strong>4K</strong>
                <span>4 积分</span>
              </div>
            </div>
          </div>
          <Generator />
          <GalleryPreview />
        </section>
      </main>
    </div>
  );
}
