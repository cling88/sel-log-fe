import { Gnb } from "@/component/layout/gnb";
import { MobileTabBar } from "@/component/layout/mobile-tab-bar";
import { MasterDataProvider } from "@/context/master-data-context";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MasterDataProvider>
      <div className="flex min-h-full flex-col bg-zinc-100">
        <Gnb />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6">
          {children}
        </main>
        <MobileTabBar />
      </div>
    </MasterDataProvider>
  );
}
