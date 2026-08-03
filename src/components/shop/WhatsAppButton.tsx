"use client";

import { usePathname } from "next/navigation";
import { WHATSAPP_URL } from "@/lib/social";

export function WhatsAppButton() {
  const pathname = usePathname();
  const raised = pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`fixed right-4 sm:right-5 z-30 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-all ${
        raised ? "bottom-24 sm:bottom-5" : "bottom-5"
      }`}
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" aria-hidden>
        <path d="M16.04 4C9.4 4 4 9.37 4 16c0 2.25.62 4.36 1.7 6.17L4 28l5.98-1.66A11.9 11.9 0 0 0 16.04 28C22.68 28 28 22.63 28 16S22.68 4 16.04 4Zm0 21.7c-1.98 0-3.83-.56-5.4-1.53l-.39-.24-3.55.98.95-3.46-.25-.4a9.6 9.6 0 0 1-1.5-5.05c0-5.36 4.4-9.7 9.79-9.7 5.38 0 9.79 4.34 9.79 9.7 0 5.37-4.41 9.7-9.79 9.7Zm5.36-7.28c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.6-.91-2.2-.24-.57-.48-.5-.66-.5-.17 0-.37-.02-.56-.02-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.2 3.02c.15.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.35Z" />
      </svg>
    </a>
  );
}
