import Link from "next/link";
import { getServerSession } from "next-auth";
import { LogIn, LogOut, Sparkles } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>{APP_NAME}</span>
        </Link>
        <nav className="nav-links">
          <Link href="/#generator">生成</Link>
          <Link href="/gallery">创意案例</Link>
          <Link href="/pricing">价格</Link>
          <Link href="/history">历史</Link>
          {isAdmin ? <Link href="/admin">后台</Link> : null}
          {session?.user ? (
            <LogoutButton>
              <LogOut size={16} />
              退出
            </LogoutButton>
          ) : (
            <Link className="button button-primary" href="/login">
              <LogIn size={16} />
              登录
            </Link>
          )}
          <Link className="button button-secondary" href="/#generator">
            <Sparkles size={16} />
            开始创作
          </Link>
        </nav>
      </div>
    </header>
  );
}
