"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Credits } from "@/components/credits";
import { appRoutes, product } from "@/lib/constants";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
};

const navigation = appRoutes.filter((route) => !route.href.includes("#"));

export function AppShell({ children, title, eyebrow }: AppShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={isOpen ? "sidebar sidebar--open" : "sidebar"}>
        <div className="sidebar__brand">
          <Link href="/" className="brand-mark" onClick={() => setIsOpen(false)}>
            <span aria-hidden>FB</span>
            <strong>{product.shortName}</strong>
          </Link>
          <button
            className="icon-button sidebar__close"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {navigation.map((route) => {
            const Icon = route.icon;
            const isActive =
              route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={isActive ? "nav-item nav-item--active" : "nav-item"}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={18} aria-hidden />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <Credits compact />
        </div>
      </aside>

      <div className="app-shell__content">
        <header className="topbar">
          <button
            className="icon-button topbar__menu"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} aria-hidden />
          </button>
          <div>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h1>{title}</h1>
          </div>
          <Credits compact />
        </header>

        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
