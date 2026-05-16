import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <div className="app-shell">
      <Header />
      <main className="form-page">
        <div className="panel form-card">
          <h1>页面不存在</h1>
          <p className="muted">这个页面暂时没有内容。</p>
          <Link className="button button-primary" href="/">
            回到 LittleMelon Image
          </Link>
        </div>
      </main>
    </div>
  );
}
