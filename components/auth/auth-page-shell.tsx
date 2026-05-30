import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

interface AuthPageShellProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function AuthPageShell({ children, description, title }: AuthPageShellProps) {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-48px)] w-full max-w-5xl items-center gap-6 py-6 lg:grid-cols-[minmax(0,0.9fr)_420px]">
      <div className="hidden flex-col gap-5 lg:flex">
        <div className="grid size-12 place-items-center rounded-card bg-primary text-white shadow-sm">
          <ShieldCheck aria-hidden size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">本地家庭仓储</p>
          <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-text-primary">
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[420px]">{children}</div>
    </section>
  );
}
