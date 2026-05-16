import { prisma } from "@/lib/prisma";
import { InteractiveGallery } from "./InteractiveGallery";

export async function GalleryPreview() {
  const [creativeItems, otherItems] = await Promise.all([
    prisma.promptGallery.findMany({
      where: {
        id: { startsWith: "github-" },
        category: "创意灵感",
        NOT: [
          { prompt: { contains: "围绕这个画面方向" } },
          { title: { contains: "Claude Code" } },
          { title: { contains: "插件" } }
        ]
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 16
    }),
    prisma.promptGallery.findMany({
      where: {
        id: { startsWith: "github-" },
        category: {
          not: "创意灵感"
        },
        NOT: [
          { prompt: { contains: "围绕这个画面方向" } },
          { title: { contains: "Claude Code" } },
          { title: { contains: "插件" } }
        ]
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 48
    })
  ]);
  const items = [...creativeItems, ...otherItems];

  if (creativeItems.length === 0) {
    const fallbackItems = await prisma.promptGallery.findMany({
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 16
    });
    return (
      <section className="gallery-section">
        <div>
          <div className="section-title compact">
            <div>
              <h2>实时创意图库</h2>
              <p className="muted">来自 GitHub 开源项目和同步库的灵感案例，先看作品，再切换到电商、修图或专利图。</p>
            </div>
            <a className="button button-secondary" href="/gallery">
              查看全部
            </a>
          </div>
          <InteractiveGallery items={fallbackItems} compact initialFilter="全部" />
        </div>
      </section>
    );
  }

  return (
    <section className="gallery-section">
      <div>
        <div className="section-title compact">
          <div>
            <h2>实时创意图库</h2>
            <p className="muted">来自 GitHub 开源项目和同步库的灵感案例，先看作品，再切换到电商、修图或专利图。</p>
          </div>
          <a className="button button-secondary" href="/gallery">
            查看全部
          </a>
        </div>
        <InteractiveGallery items={items} compact initialFilter="创意灵感" />
      </div>
    </section>
  );
}
