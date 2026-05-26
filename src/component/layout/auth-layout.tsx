export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4">
      {children}
    </div>
  );
}
