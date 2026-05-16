import type { Metadata } from "next";
import "./styles.css";
import { APP_NAME } from "@/lib/constants";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: `${APP_NAME} | 小西瓜 AI 图片`,
  description: "面向电商产品图和 AI 修图的 GPT-Image-2 生图工具。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
