import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "AI+X黑客松大赛",
  description:
    "东鹏集团 AI+X黑客松大赛官方平台 — 让 AI 走进业务场景，让创新真正落地。",
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
