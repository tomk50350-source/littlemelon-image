import { getServerSession } from "next-auth";
import Link from "next/link";
import { Header } from "@/components/Header";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const items = session?.user?.id
    ? await prisma.generation.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5
      })
    : [];

  return (
    <div className="app-shell">
      <Header />
      <main className="band">
        <div className="container">
          <div className="section-title">
            <div>
              <h1>最近 5 张历史</h1>
              <p className="muted">只展示最近 5 张，点击卡片可下载原图。</p>
            </div>
          </div>
          {!session ? (
            <div className="notice">
              请先 <Link href="/login">登录</Link> 后查看历史。
            </div>
          ) : (
            <div className="history-grid">
              {items.map((item) => (
                <a className="card" href={`/api/download/${item.id}`} target="_blank" key={item.id}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="thumb" src={item.imageUrl} alt={item.prompt} />
                  ) : (
                    <div className="thumb" />
                  )}
                  <div className="card-body">
                    <span className="tag">{item.sizeLabel}</span>
                    <p className="muted">{item.prompt}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
