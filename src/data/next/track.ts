import type { Track } from "@/lib/types";
import { boardTopics } from "@/data/next/topics-board";
import { capstoneTopics } from "@/data/next/topics-capstone";
import { uiTopics } from "@/data/next/topics-ui";

export const nextTrack: Track = {
  id: "nextjs",
  title: "Next.js con backend",
  tagline: "De los componentes al preparcial, contra una API NestJS",
  description:
    "Construye el frontend de Coffee Orders y ciérralo con dos flujos completos: solicitudes de impresión y reservas de sala. La sesión, el filtro y el id del recurso viven en Next.js; la regla de negocio sigue en NestJS.",
  topics: [...uiTopics, ...boardTopics, ...capstoneTopics],
};
