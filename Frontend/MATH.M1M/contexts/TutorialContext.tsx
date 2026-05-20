/**
 * TutorialContext
 *
 * Maneja el estado global del tutorial interactivo para nuevos usuarios.
 *
 * Flujo:
 *  1. Después del registro se llama a `scheduleTutorial()`.
 *  2. La primera vez que se abre Home, el tutorial inicia automáticamente.
 *  3. "Siguiente" avanza el paso; al llegar al último paso de un tab,
 *     emite `onTabChange` para que el tab cambie.
 *  4. Al completar todos los pasos se muestra la pantalla de celebración
 *     y se marca `@tutorial_completed = true` en AsyncStorage.
 *  5. Un botón "?" en Home permite reiniciar el tutorial manualmente.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_STEPS,
  TAB_ORDER,
  TutorialStep,
  TutorialTab,
} from "../constants/tutorialSteps";

const STORAGE_KEY = "@taskpin_tutorial_completed";
const PENDING_KEY = "@taskpin_tutorial_pending";

// ─────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────

interface TutorialContextType {
  /** Si el tutorial está activo ahora mismo */
  isActive: boolean;
  /** Paso actual (0-based) */
  currentStepIndex: number;
  /** Paso actual como objeto */
  currentStep: TutorialStep | null;
  /** Si estamos mostrando la pantalla de celebración final */
  showCelebration: boolean;
  /** Avanza al siguiente paso */
  next: () => void;
  /** Salta y cierra el tutorial */
  skip: () => void;
  /** Reinicia el tutorial desde el principio */
  restart: () => void;
  /** Registra un callback para cuando hay que cambiar de tab */
  setTabChangeHandler: (fn: (tab: TutorialTab) => void) => void;
  /** Marca que el tutorial debe correr (llamar tras el registro) */
  scheduleTutorial: () => Promise<void>;
  /** Cierra la pantalla de celebración */
  dismissCelebration: () => void;
}

// ─────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export function useTutorial(): TutorialContextType {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial debe usarse dentro de TutorialProvider");
  return ctx;
}

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Callback externo para cambiar de tab (lo registra el tabs _layout)
  const tabChangeHandlerRef = useRef<((tab: TutorialTab) => void) | null>(null);

  const setTabChangeHandler = useCallback(
    (fn: (tab: TutorialTab) => void) => {
      tabChangeHandlerRef.current = fn;
    },
    []
  );

  // Al montar, verificar si hay un tutorial pendiente
  useEffect(() => {
    (async () => {
      const pending = await AsyncStorage.getItem(PENDING_KEY);
      const completed = await AsyncStorage.getItem(STORAGE_KEY);
      if (pending === "true" && completed !== "true") {
        await AsyncStorage.removeItem(PENDING_KEY);
        setCurrentStepIndex(0);
        setIsActive(true);
      }
    })();
  }, []);

  // ─────────── Helpers ───────────

  const currentStep = isActive ? TUTORIAL_STEPS[currentStepIndex] ?? null : null;

  const complete = useCallback(async () => {
    setIsActive(false);
    setShowCelebration(true);
    await AsyncStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = useCallback(() => {
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= TUTORIAL_STEPS.length) {
      // Todos los pasos completados
      complete();
      return;
    }

    const nextStep = TUTORIAL_STEPS[nextIndex];
    const currentTabStep = TUTORIAL_STEPS[currentStepIndex];

    // Si el siguiente paso es de un tab diferente, cambiar de tab
    if (nextStep.tab !== currentTabStep?.tab) {
      tabChangeHandlerRef.current?.(nextStep.tab);
    }

    setCurrentStepIndex(nextIndex);
  }, [currentStepIndex, complete]);

  const skip = useCallback(async () => {
    setIsActive(false);
    await AsyncStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const restart = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCurrentStepIndex(0);
    // Navegar al tab home primero
    tabChangeHandlerRef.current?.("home");
    setIsActive(true);
  }, []);

  const scheduleTutorial = useCallback(async () => {
    const completed = await AsyncStorage.getItem(STORAGE_KEY);
    if (completed !== "true") {
      // Activar directo en el estado de React (no esperar a un useEffect)
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // ─────────── Valor del contexto ───────────

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        showCelebration,
        next,
        skip,
        restart,
        setTabChangeHandler,
        scheduleTutorial,
        dismissCelebration,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
