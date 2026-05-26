export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold tracking-tight text-black">
      {children}
    </h1>
  );
}
