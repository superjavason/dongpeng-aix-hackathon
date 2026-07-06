import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-neutral-50">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="东鹏"
            width={76}
            height={28}
            className="h-7 w-auto shrink-0 object-contain"
          />
        </div>
        <p>© 2026 东鹏 AI+X黑客松大赛组委会</p>
      </div>
    </footer>
  );
}
