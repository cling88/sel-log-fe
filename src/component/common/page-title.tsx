export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
      {children}
    </h1>
  );
}
