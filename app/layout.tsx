import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "爱管家",
  description: "爱管家，面向家庭局域网和 NAS 部署的家庭 AI 仓储管理 Web 应用"
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
