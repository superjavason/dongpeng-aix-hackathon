import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 品牌侧 */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-ink p-12 text-white lg:flex">
        <div className="absolute inset-0 tech-hero-bg" />
        <div className="absolute inset-0 tech-circuit-grid" />
        <div className="absolute inset-0 tech-scan-lines" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-sm font-black text-white">
            AI
          </span>
          <div className="leading-tight">
            <span className="block text-lg font-bold">AI+X黑客松大赛</span>
            <span className="block text-xs text-white/50">
              东鹏集团首届 AI 创新应用大赛
            </span>
          </div>
        </Link>
        <div className="relative z-10">
          <div className="tech-logo-field relative mb-12 flex h-48 w-48 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <div className="absolute inset-5 rounded-full bg-black/10 ring-1 ring-white/10" />
            <div className="relative z-10 text-center">
              <div className="text-4xl font-black leading-none tracking-tight text-white">
                AI+X
              </div>
              <div className="mt-2 text-sm font-semibold tracking-[0.18em] text-brand">
                HACKATHON
              </div>
            </div>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight">
              AI+X黑客松大赛
              <br />
              <span className="text-brand">让创新真正落地</span>
            </h2>
            <p className="mt-6 text-white/70">
              让 AI 走进业务场景，围绕真实问题提报创意、组建团队、提交作品，让每一个想法都有机会被看见并落地。
            </p>
          </div>
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
