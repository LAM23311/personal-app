import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人工具箱",
  description: "记账、日志、小游戏",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen pb-16">
        {children}
        <nav
          className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-14 z-50 safe-area-bottom"
          style={{
            background: 'linear-gradient(180deg, #F0E8D8 0%, #E8DFD0 100%)',
            borderTop: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 -2px 10px rgba(120,100,70,0.06)',
            borderRadius: '18px 18px 0 0',
          }}
        >
          <a href="/" className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-90" style={{ color: '#8A7F73' }}>
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[11px] mt-0.5 font-medium">首页</span>
          </a>
          <a href="/expense" className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-90" style={{ color: '#8A7F73' }}>
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[11px] mt-0.5 font-medium">记账</span>
          </a>
          <a href="/journal" className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-90" style={{ color: '#8A7F73' }}>
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="text-[11px] mt-0.5 font-medium">日志</span>
          </a>
          <a href="/undercover" className="flex flex-col items-center justify-center flex-1 h-full transition-colors active:scale-90" style={{ color: '#8A7F73' }}>
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[11px] mt-0.5 font-medium">卧底</span>
          </a>
        </nav>
      </body>
    </html>
  );
}
