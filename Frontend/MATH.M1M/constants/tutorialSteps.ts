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
    title: "¡Bienvenido a Taskpin! 👋",
    description:
      "Aquí está tu resumen diario. De un vistazo verás tu racha, tus puntos y el nivel que llevas. ¡Todo lo que necesitas saber en un solo lugar!",
    // Header de saludo: safeAreaTop(~47) + paddingTop(16) = ~63px → ~0.07
    // Altura del bloque de saludo: ~75px → 0.09
    spotlight: { topPercent: 0.06, heightPercent: 0.11 },
    tooltipPosition: "bottom",
  },
  {
    id: "home_racha",
    tab: "home",
    icon: "flame",
    title: "Racha · Puntos · Nivel 🔥",
    description:
      "Las tres tarjetas resumen tu progreso: racha de días consecutivos, puntos ganados y nivel actual. La racha se pierde si no completas ningún hábito ese día.",
    // Después del header (~88px) + su marginBottom(24) = Y≈175 → 0.20
    // Altura de las stat cards: ~105px → 0.13
    spotlight: { topPercent: 0.20, heightPercent: 0.13 },
    tooltipPosition: "bottom",
  },
  {
    id: "home_habitos_hoy",
    tab: "home",
    icon: "checkmark-circle",
    title: "Hábitos de hoy ✅",
    description:
      "Aquí aparecen los hábitos que debes completar hoy. Tócalos para marcarlos como hechos y gana puntos. ¡Cada uno cuenta!",
    // Después de statsRow + progressCard (~300px bloque) = Y≈490 → 0.54
    // Sección con header + 2-3 hábitos: ~220px → 0.24
    spotlight: { topPercent: 0.54, heightPercent: 0.22 },
    tooltipPosition: "top",
  },
  {
    id: "home_planes",
    tab: "home",
    icon: "map",
    title: "Mis Planes 🗺️",
    description:
      "Los planes son metas grandes divididas en fases, como 'Bajar 10kg' o 'Aprender inglés'. Desplázate hacia abajo para ver tu progreso.",
    // Sección Planes Activos aparece al fondo del scroll sin desplazarse (~0.76)
    spotlight: { topPercent: 0.76, heightPercent: 0.14 },
    tooltipPosition: "top",
  },
  {
    id: "home_reflexion",
    tab: "home",
    icon: "journal",
    title: "Reflexión diaria 📝",
    description:
      "Desplázate hasta el final para encontrar Reflexión diaria. Ahí puedes registrar cómo te sentiste y qué mejorarías cada día.",
    // Reflexión está debajo de Planes en el scroll; señala zona bajo Planes
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
    title: "Mis Hábitos 📋",
    description:
      "Aquí están todos tus hábitos activos. Cada tarjeta muestra su nombre, categoría y cuántos días llevas de racha individual.",
    // Después del header fijo (~85px) + paddingTop(20) + statsContainer(~90px) = Y≈195 → 0.23
    // Zona de las habit cards: ~200px → 0.24
    spotlight: { topPercent: 0.23, heightPercent: 0.24 },
    tooltipPosition: "bottom",
  },
  {
    id: "habitos_detalle",
    tab: "habitos",
    icon: "stats-chart",
    title: "Toca un hábito 👆",
    description:
      "Al tocar cualquier hábito puedes ver su historial, tasa de éxito y estadísticas de los últimos 30 días. ¡Conoce tus patrones!",
    // Primera habit card dentro de la lista
    spotlight: { topPercent: 0.30, heightPercent: 0.16 },
    tooltipPosition: "bottom",
  },
  {
    id: "habitos_agregar",
    tab: "habitos",
    icon: "add-circle",
    title: "Agrega nuevos hábitos ➕",
    description:
      "Toca el botón '+' arriba a la derecha para explorar hábitos predefinidos por categoría o crear los tuyos con color, ícono y frecuencia personalizada.",
    // El botón + está en el HEADER FIJO; se inicia desde la parte más alta posible
    // para capturar el header antes del statsContainer (que empieza ~0.13)
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
    title: "Tus Planes de vida 🏆",
    description:
      "Los planes son metas a largo plazo con fases y tareas específicas. Puedes seguir planes predesignados o crear los tuyos.",
    // Stats (3 cards) + filtros de tab: aparecen justo bajo el header fijo (~0.12–0.30)
    spotlight: { topPercent: 0.12, heightPercent: 0.22 },
    tooltipPosition: "bottom",
  },
  {
    id: "planes_seguimiento",
    tab: "planes",
    icon: "trending-up",
    title: "Sigue tu progreso 📈",
    description:
      "Entra a cualquier plan para ver la línea del tiempo, fases completadas y las tareas pendientes. El progreso se actualiza en tiempo real.",
    // Primera plan card aparece después de stats + filtros (~0.34–0.55)
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
    title: "Hábitos Sugeridos 💡",
    description:
      "La IA compara tu perfil con usuarios similares y te sugiere hábitos que podrían encajar bien con tus rutinas. ¡Prueba los que te interesen!",
    // Header fijo(~85) + paddingTop(20) + statsContainer(~90) + mb(24) = Y≈220 → 0.26
    // Sección Hábitos Sugeridos ocupa buena parte de la pantalla (varios cards)
    spotlight: { topPercent: 0.26, heightPercent: 0.36 },
    tooltipPosition: "top",
  },
  {
    id: "ai_predicciones",
    tab: "ai",
    icon: "sparkles",
    title: "Predicciones de IA 🤖",
    description:
      "Desplázate hacia abajo para ver 'Predicciones de Hoy': la IA analiza tu historial y predice qué hábitos tienes más probabilidad de completar hoy.",
    // Predicciones de Hoy aparece debajo de los Hábitos Sugeridos (requiere scroll)
    // Spotlight apunta a la zona baja como indicador visual de "hay más abajo"
    spotlight: { topPercent: 0.80, heightPercent: 0.06 },
    tooltipPosition: "top",
  },
  {
    id: "ai_porcentaje",
    tab: "ai",
    icon: "analytics",
    title: "¿Qué significa el %? 📊",
    description:
      "El porcentaje de coincidencia muestra qué tan compatible es un hábito con tu perfil. En Predicciones de Hoy también verás la probabilidad de completarlo hoy.",
    // Señala los cards de recomendaciones donde el % de coincidencia es visible
    spotlight: { topPercent: 0.44, heightPercent: 0.25 },
    tooltipPosition: "top",
  },

  // ─────────────────────────────────────────
  // TAB: PERFIL (2 pasos)
  // Layout: SafeAreaView > ScrollView TODO (paddingTop 16)
  // Orden JSX: header(settingsButton) → profileCard → todayCard → achievementsSection
  // ─────────────────────────────────────────
  {
    id: "perfil_config",
    tab: "perfil",
    icon: "settings",
    title: "Configuración ⚙️",
    description:
      "Toca el ícono ⚙️ arriba a la derecha para cambiar tu nombre, correo, contraseña y activar el modo oscuro.",
    // El settingsButton (44×44) está en el header de la pantalla Perfil.
    // Iniciamos desde 0.04 para capturar solo el header row sin invadir la profileCard
    // (que empieza ~0.16). Rango: 0.04–0.12 ≈ status bar + header row.
    spotlight: { topPercent: 0.04, heightPercent: 0.09 },
    tooltipPosition: "bottom",
  },
  {
    id: "perfil_logros",
    tab: "perfil",
    icon: "ribbon",
    title: "Tus Logros 🏅",
    description:
      "Desbloquea insignias completando hábitos, manteniendo rachas y alcanzando nuevos niveles. Toca 'Ver todos' para ver los que te faltan.",
    // achievementsSection: después de header + profileCard + todayCard (~0.65)
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
