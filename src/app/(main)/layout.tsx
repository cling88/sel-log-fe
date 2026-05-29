import { Gnb } from "@/components/layout/gnb";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Gnb />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 md:pb-8">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
