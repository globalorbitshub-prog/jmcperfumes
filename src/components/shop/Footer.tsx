import Link from "next/link";

export function ShopFooter() {
  return (
    <footer className="bg-primary text-cream mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-heading text-xl mb-2">JMC Perfumes</div>
          <p className="text-cream/70">Perfumes premium desde 2024.</p>
          <div className="flex gap-3 mt-3 text-cream/70">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noreferrer">
              Pinterest
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer">
              TikTok
            </a>
          </div>
        </div>

        <div>
          <div className="font-medium mb-2">Navegación</div>
          <ul className="space-y-1 text-cream/70">
            <li><Link href="/products">Explorar</Link></li>
            <li><Link href="/#categories">Categorías</Link></li>
            <li><Link href="/#about">Sobre nosotros</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Legal</div>
          <ul className="space-y-1 text-cream/70">
            <li><Link href="/legal/privacy">Privacidad</Link></li>
            <li><Link href="/legal/terms">Términos y Condiciones</Link></li>
            <li><Link href="/legal/returns">Política de devoluciones</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Contacto</div>
          <ul className="space-y-1 text-cream/70">
            <li>contacto@jmcperfumes.es</li>
            <li>Lun-Vie 9-18h</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto text-xs text-cream/50">
        <span>© {new Date().getFullYear()} JMC Perfumes. Todos los derechos reservados.</span>
        <a href="/auth/login" className="hover:text-cream/80">
          Admin
        </a>
      </div>
    </footer>
  );
}
