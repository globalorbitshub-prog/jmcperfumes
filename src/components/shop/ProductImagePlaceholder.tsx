export function ProductImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/5 to-accent/10 ${className}`}>
      <svg viewBox="0 0 64 64" className="w-1/3 h-1/3 text-primary/20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M26 8h12v6.5l3.5 4.5v33a4 4 0 0 1-4 4H26.5a4 4 0 0 1-4-4v-33L26 14.5V8Z" strokeLinejoin="round" />
        <path d="M28 8h8" strokeLinecap="round" />
        <path d="M22.5 26h19" />
        <path d="M25 34h14M25 40h14M25 46h14" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}
