import { Inter, Space_Grotesk } from "next/font/google";

// Fontes do design da página de vendas e das telas de login. Uma instância só, usada nos dois lugares.
export const fonteDisplay = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
export const fonteTexto = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
