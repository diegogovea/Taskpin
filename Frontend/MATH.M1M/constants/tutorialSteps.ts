/**
 * Tutorial Steps — Definición de todos los pasos del tutorial de nuevos usuarios.
 *
 * Cada paso pertenece a un tab y describe:
 *  - Qué área de la pantalla señalar (spotlight: posición Y relativa a la pantalla)
 *  - Título e ícono de la tarjeta tutorial
 *  - Descripción explicativa
 *  - Si el tooltip va arriba o abajo del spotlight
 */

export type TutorialTab = "home" | "habitos" | "planes" | "ai" | "perfil";
export type TooltipPosition = "top" | "bottom";

export interface TutorialStep {
  id: string;
  tab: TutorialTab;
  icon: string;
  title: string;
  description: string;
  /** Posición del spotlight: qué % del alto de pantalla ocupa y desde dónde arranca */
  spotlight: {
    topPercent: number;    // 0–1: dónde empieza el área resaltada
    heightPercent: number; // 0–1: qué alto tiene el spotlight
  };
  tooltipPosition: TooltipPosition;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─────────────────────────────────────────
  // TAB: HOME (5 pasos)
  // Layout: SafeAreaView > ScrollView (paddingTop 16)
  // Orden JSX: header → statsRow → progressCard → hábitos → planes → reflexión
  // ─────────────────────────────────────────
  {
    id: "home_bienvenida",
    tab: "home",
    icon: "hand-left",
    title: "Bienvenido a Taskpin",
    description:
      "Esta es tu pantalla principal. Aquí verás un resumen de tu día: racha activa, puntos acumulados y el nivel en que te encuentras.",
    spotlight: { topPercent: 0.06, heightPercent: 0.11 },
    tooltipPosition: "bottom",
  },
  {
    id: "home_racha",
    tab: "home",
    icon: "flame",
    title: "Racha, Puntos y Nivel",
    description:
      "Estas tres tarjetas resumen tu progreso. La racha crece cada día que completas al menos un hábito. Si no completas ninguno ese día, la racha se reinicia.",
    spotlight: { topPercent: 0.20, heightPercent: 0.13 },
    tooltipPosition: "bottom",
  },
  {
    id: "home_habitos_hoy",
    tab: "home",
    icon: "checkmark-circle",
    title: "Hábitos de hoy",
    description:
      "Aquí aparecen los hábitos que tienes programados para hoy. Toca cualquiera para marcarlo como completado y sumar puntos a tu cuenta.",
    spotlight: { topPercent: 0.54, heightPercent: 0.22 },
    tooltipPosition: "top",
  },
  {
    id: "home_planes",
    tab: "home",
    icon: "map",
    title: "Mis Planes",
    description:
      "Los planes son metas a largo plazo divididas en fases, como mejorar tu alimentación o aprender una nueva habilidad. Desplázate hacia abajo para verlos.",
    spotlight: { topPercent: 0.76, heightPercent: 0.14 },
    tooltipPosition: "top",
  },
  {
    id: "home_reflexion",
    tab: "home",
    icon: "journal",
    title: "Reflexión diaria",
    description:
      "Al final del scroll encontrarás la Reflexión diaria. Ahí puedes anotar cómo te sentiste y qué mejorarías. Es un hábito en sí mismo.",
    spotlight: { topPercent: 0.88, heightPercent: 0.04 },
    tooltipPosition: "top",
  },

  // ─────────────────────────────────────────
  // TAB: HÁBITOS (3 pasos)
  // Layout: SafeAreaView > header FIJO (~85px) > ScrollView (paddingTop 20)
  // Orden JSX: statsContainer → progressSection → habitsSection
  // ─────────────────────────────────────────
  {
    id: "habitos_lista",
    tab: "habitos",
    icon: "list",
    title: "Mis Hábitos",
    description:
      "Aquí están todos tus hábitos activos. Cada tarjeta muestra el nombre, la categoría y los días de racha individual que llevas.",
    spotlight: { topPercent: 0.23, heightPercent: 0.24 },
    tooltipPosition: "bottom",
  },
  {
    id: "habitos_detalle",
    tab: "habitos",
    icon: "stats-chart",
    title: "Toca un hábito para ver detalles",
    description:
      "Al tocar cualquier hábito accedes a su historial, tasa de éxito y estadísticas de los últimos 30 días. Úsalo para identificar tus patrones.",
    spotlight: { topPercent: 0.30, heightPercent: 0.16 },
    tooltipPosition: "bottom",
  },
  {
    id: "habitos_agregar",
    tab: "habitos",
    icon: "add-circle",
    title: "Agregar nuevos hábitos",
    description:
      "El botón + está arriba a la derecha. Desde ahí puedes explorar hábitos predefinidos por categoría o crear uno propio con color, ícono y frecuencia.",
    spotlight: { topPercent: 0.00, heightPercent: 0.12 },
    tooltipPosition: "bottom",
  },

  // ─────────────────────────────────────────
  // TAB: PLANES (2 pasos)
  // Layout: SafeAreaView > header FIJO (~85px) > ScrollView (paddingTop 20)
  // Orden JSX: statsContainer → filterContainer → plansSection
  // ─────────────────────────────────────────
  {
    id: "planes_lista",
    tab: "planes",
    icon: "trophy",
    title: "Tus Planes de vida",
    description:
      "Los planes son metas a largo plazo con fases y tareas específicas. Puedes seguir planes predefinidos o crear los tuyos desde cero.",
    spotlight: { topPercent: 0.12, heightPercent: 0.22 },
    tooltipPosition: "bottom",
  },
  {
    id: "planes_seguimiento",
    tab: "planes",
    icon: "trending-up",
    title: "Seguimiento de un plan",
    description:
      "Toca cualquier plan para ver su línea del tiempo, las fases completadas y las tareas pendientes. El progreso se actualiza en tiempo real.",
    spotlight: { topPercent: 0.34, heightPercent: 0.22 },
    tooltipPosition: "bottom",
  },

  // ─────────────────────────────────────────
  // TAB: IA (3 pasos)
  // Layout: SafeAreaView > header FIJO (~85px) > ScrollView (paddingTop 20)
  // Orden JSX REAL: statsContainer → "Hábitos Sugeridos" → "Predicciones de Hoy" → infoCard
  // IMPORTANTE: recomendaciones van ANTES que predicciones en la UI
  // ─────────────────────────────────────────
  {
    id: "ai_recomendaciones",
    tab: "ai",
    icon: "bulb",
    title: "Hábitos Sugeridos",
    description:
      "La IA analiza el comportamiento de usuarios similares a ti y sugiere hábitos que encajan con tu perfil. Toca el botón + para agregarlos a tu lista.",
    spotlight: { topPercent: 0.26, heightPercent: 0.36 },
    tooltipPosition: "top",
  },
  {
    id: "ai_predicciones",
    tab: "ai",
    icon: "sparkles",
    title: "Predicciones de hoy",
    description:
      "Más abajo en esta pantalla encontrarás las Predicciones de Hoy: la IA calcula qué tan probable es que completes cada hábito basándose en tu historial reciente.",
    spotlight: { topPercent: 0.80, heightPercent: 0.06 },
    tooltipPosition: "top",
  },
  {
    id: "ai_porcentaje",
    tab: "ai",
    icon: "analytics",
    title: "El porcentaje de coincidencia",
    description:
      "El número junto a cada hábito sugerido indica qué tan compatible es ese hábito con tu perfil. No es una probabilidad de completarlo: es afinidad con tus rutinas.",
    spotlight: { topPercent: 0.44, heightPercent: 0.25 },
    tooltipPosition: "top",
  },

  // ─────────────────────────────────────────
  // TAB: PERFIL (2 pasos)
  // Layout: SafeAreaView > ScrollView TODO (paddingTop 16)
  // Orden JSX: header(settingsButton) → identityCard → uniqueStats → achievementsSection
  // ─────────────────────────────────────────
  {
    id: "perfil_config",
    tab: "perfil",
    icon: "settings",
    title: "Configuración",
    description:
      "El ícono de ajustes arriba a la derecha te lleva a Configuración, donde puedes cambiar tu nombre, correo, contraseña y activar el modo oscuro.",
    spotlight: { topPercent: 0.04, heightPercent: 0.09 },
    tooltipPosition: "bottom",
  },
  {
    id: "perfil_logros",
    tab: "perfil",
    icon: "ribbon",
    title: "Tus Logros",
    description:
      "Desbloquea insignias completando hábitos, manteniendo rachas y subiendo de nivel. Toca 'Ver todos' para ver cuáles te faltan por conseguir.",
    spotlight: { topPercent: 0.64, heightPercent: 0.22 },
    tooltipPosition: "top",
  },
];

export const STEPS_BY_TAB: Record<TutorialTab, TutorialStep[]> = {
  home: TUTORIAL_STEPS.filter((s) => s.tab === "home"),
  habitos: TUTORIAL_STEPS.filter((s) => s.tab === "habitos"),
  planes: TUTORIAL_STEPS.filter((s) => s.tab === "planes"),
  ai: TUTORIAL_STEPS.filter((s) => s.tab === "ai"),
  perfil: TUTORIAL_STEPS.filter((s) => s.tab === "perfil"),
};

export const TAB_ORDER: TutorialTab[] = ["home", "habitos", "planes", "ai", "perfil"];
