import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        설정
      </h1>
      <div className="mt-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
