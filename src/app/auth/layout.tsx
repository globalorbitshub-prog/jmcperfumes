export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-cream">JMC Perfumes</h1>
          <p className="text-border text-sm mt-1">Panel de administración</p>
        </div>
        <div className="bg-cream rounded-lg shadow-lg p-8">{children}</div>
      </div>
    </div>
  );
}
