import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "东鹏 AI+X 黑客松",
  description:
    "东鹏 AI+X 黑客松官方平台 — 提报项目、自由组队、提交作品、专业评审。科技·艺术·生活。",
  icons: { icon: "/logo2.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          ["--font-sans" as string]:
            '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", system-ui, sans-serif',
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
