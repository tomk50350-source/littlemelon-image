import { Header } from "@/components/Header";
import { InteractiveGallery } from "@/components/InteractiveGallery";
import { prisma } from "@/lib/prisma";

export default async function GalleryPage() {
  const items = await prisma.promptGallery.findMany({
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
    take: 60
  });

  return (
    <div className="app-shell">
      <Header />
      <main className="band">
        <div className="container">
          <div className="section-title">
            <div>
              <h1>提示词图库</h1>
              <p className="muted">默认展示同步库里的创意案例，用户可再切换查看电商产品图、AI 修图和专利制图标准。</p>
            </div>
          </div>
          <InteractiveGallery items={items} initialFilter="创意灵感" loadMore />
        </div>
      </main>
    </div>
  );
}
