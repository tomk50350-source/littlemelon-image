import { Header } from "@/components/Header";
import { InteractiveGallery } from "@/components/InteractiveGallery";
import { GALLERY_PAGE_SIZE, galleryBaseWhere, getRotatingGalleryItems } from "@/lib/gallery";

export default async function GalleryPage() {
  const seed = Date.now();
  const { items, total } = await getRotatingGalleryItems({
    where: galleryBaseWhere,
    take: GALLERY_PAGE_SIZE,
    seed,
    order: "latest"
  });

  return (
    <div className="app-shell">
      <Header />
      <main className="band">
        <div className="container">
          <div className="section-title">
            <div>
              <h1>创意案例</h1>
            </div>
          </div>
          <InteractiveGallery items={items} loadMore initialSeed={seed} initialHasMore={total > items.length} />
        </div>
      </main>
    </div>
  );
}
