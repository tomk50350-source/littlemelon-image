import { GalleryPreview } from "@/components/GalleryPreview";
import { Generator } from "@/components/Generator";
import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="clean-home">
        <Generator />
        <GalleryPreview />
      </main>
    </div>
  );
}
