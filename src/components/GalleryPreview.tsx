import { prisma } from "@/lib/prisma";
import { InteractiveGallery } from "./InteractiveGallery";

export async function GalleryPreview() {
  const items = await prisma.promptGallery.findMany({
    where: {
      id: { startsWith: "github-" },
      NOT: [
        { prompt: { contains: "围绕这个画面方向" } },
        { title: { contains: "Claude Code" } },
        { title: { contains: "插件" } },
        { title: { contains: "广告" } }
      ]
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 24
  });

  if (items.length === 0) {
    const fallbackItems = await prisma.promptGallery.findMany({
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 24
    });
    return (
      <section className="gallery-section">
        <div>
          <div className="section-title compact">
            <div>
              <h2>创意案例</h2>
            </div>
            <a className="button button-secondary" href="/gallery">
              查看全部
            </a>
          </div>
          <InteractiveGallery items={fallbackItems} compact showControls={false} />
        </div>
      </section>
    );
  }

  return (
    <section className="gallery-section">
      <div>
          <div className="section-title compact">
            <div>
            <h2>创意案例</h2>
          </div>
          <a className="button button-secondary" href="/gallery">
            查看全部
          </a>
        </div>
        <InteractiveGallery items={items} compact showControls={false} />
      </div>
    </section>
  );
}
