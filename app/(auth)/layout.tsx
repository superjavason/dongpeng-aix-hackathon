import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 品牌侧 */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 brand-gradient opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-[0.07]" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <Image
            src="/logo2.png"
            alt="东鹏"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
          />
          <span className="text-lg font-bold">AI+X黑客松大赛</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            用 AI 重塑
            <br />
            <span className="text-brand">科技 · 艺术 · 生活</span>
          </h2>
          <p className="mt-6 text-white/70">
            提报你的创意，自由组队，提交作品，接受专业评审。让每一个想法都有机会落地。
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          © 2026 东鹏 AI+X黑客松大赛组委会
        </p>
      </div>

      {/* 表单侧 */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
