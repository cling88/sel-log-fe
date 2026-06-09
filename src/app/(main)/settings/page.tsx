import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        설정
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        추천 판매가 마진·부가세·기본 채널을 관리합니다.
      </p>
      <div className="mt-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
