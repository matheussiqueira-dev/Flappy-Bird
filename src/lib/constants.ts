import {
  BarChart3,
  Gamepad2,
  Home,
  Info,
  Settings,
  UserRound,
} from "lucide-react";

export const developer = {
  name: "Matheus Siqueira",
  portfolio: "https://www.matheussiqueira.dev",
  linkedin: "https://www.linkedin.com/in/matheussiqueira-dev",
  credit: "Desenvolvido por Matheus Siqueira",
};

export const product = {
  name: "Flappy Bird com Gestos",
  shortName: "Flappy Gestures",
  description:
    "Aplicação web profissional para demonstrar controle gestual, visão computacional e arquitetura preparada para Vercel.",
  repository: "https://github.com/matheussiqueira-dev/Flappy-Bird",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://flappy-bird-gestos.vercel.app",
};

export const appRoutes = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Jogar", icon: Gamepad2 },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Perfil", icon: UserRound },
  { href: "/about", label: "Projeto", icon: Info },
  { href: "/settings#runtime", label: "Ajustes", icon: Settings },
];

export const productionSignals = [
  "Next.js App Router",
  "TypeScript strict",
  "PWA instalável",
  "SEO técnico",
  "Vercel Analytics",
  "Headers de segurança",
];
