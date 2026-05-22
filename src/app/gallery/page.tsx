import { Header } from "@/components/Header";
import { InteractiveGallery } from "@/components/InteractiveGallery";
import { GALLERY_PAGE_SIZE, galleryBaseWhere, getRotatingGalleryItems } from "@/lib/gallery";

export default async function GalleryPage() {
  const seed = Date.now();
  const { items, total } = await getRotatingGalleryItems({
    where: {
      ...galleryBaseWhere,
      category: "创意灵感",
    },
    take: GALLERY_PAGE_SIZE,
    seed
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
          <InteractiveGallery items={items} initialFilter="创意灵感" loadMore initialSeed={seed} initialHasMore={total > items.length} />
        </div>
      </main>
    </div>
  );
}
