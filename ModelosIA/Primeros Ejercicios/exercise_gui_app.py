"""
APLICACIÓN GUI PARA RESOLVER EJERCICIOS MATEMÁTICOS
Interfaz gráfica que carga ejercicios del modelo de IA y permite al usuario resolverlos
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
import random
from datetime import datetime
from typing import List, Dict, Optional
import re

# Importar el modelo para generar ejercicios en tiempo real
try:
    from hybrid_model import HybridMathModel
    MODEL_AVAILABLE = True
except ImportError:
    MODEL_AVAILABLE = False
    print("⚠️ hybrid_model.py no disponible - solo se podrán cargar ejercicios guardados")

class ExerciseGameGUI:
    """
    Aplicación GUI para resolver ejercicios matemáticos
    """

    def __init__(self, root):
        self.root = root
        self.root.title("🧮 MATH_M1M - Resolvedor de Ejercicios")
        self.root.geometry("800x600")
        self.root.configure(bg='#f0f0f0')

        # Variables del juego
        self.exercises = []
        self.current_exercise_index = 0
        self.current_exercise = None
        self.score = 0
        self.total_attempted = 0
        self.session_stats = {
            'correct': 0,
            'incorrect': 0,
            'hints_used': 0,
            'start_time': datetime.now()
        }

        # Modelo de IA (si está disponible)
        self.ai_model = None
        if MODEL_AVAILABLE:
            try:
                self.ai_model = HybridMathModel()
                # Intentar cargar modelo entrenado
                self.load_trained_model()
            except Exception as e:
                print(f"⚠️ No se pudo cargar modelo de IA: {e}")

        # Crear interfaz
        self.create_widgets()
        self.update_stats_display()

        # Cargar ejercicios por defecto
        self.load_default_exercises()

    def create_widgets(self):
        """Crea todos los widgets de la interfaz"""

        # Frame principal
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Configurar grid
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)

        # Título
        title_label = ttk.Label(main_frame, text="🧮 MATH_M1M - Resolvedor de Ejercicios",
                               font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))

        # Frame superior - Controles
        controls_frame = ttk.LabelFrame(main_frame, text="📁 Controles", padding="10")
        controls_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        controls_frame.columnconfigure(1, weight=1)

        # Botones de carga
        ttk.Button(controls_frame, text="📂 Cargar Ejercicios",
                  command=self.load_exercises_file).grid(row=0, column=0, padx=(0, 10))

        ttk.Button(controls_frame, text="🎲 Generar Nuevos",
                  command=self.generate_new_exercises).grid(row=0, column=1, padx=10)

        ttk.Button(controls_frame, text="💾 Guardar Progreso",
                  command=self.save_progress).grid(row=0, column=2, padx=(10, 0))

        # Selector de tema y dificultad
        filter_frame = ttk.Frame(controls_frame)
        filter_frame.grid(row=1, column=0, columnspan=3, pady=(10, 0), sticky=(tk.W, tk.E))

        ttk.Label(filter_frame, text="Tema:").grid(row=0, column=0, padx=(0, 5))
        self.topic_var = tk.StringVar(value="todos")
        topic_combo = ttk.Combobox(filter_frame, textvariable=self.topic_var,
                                  values=["todos", "aritmetica", "algebra", "geometria", "fracciones"],
                                  width=12)
        topic_combo.grid(row=0, column=1, padx=(0, 20))

        ttk.Label(filter_frame, text="Dificultad:").grid(row=0, column=2, padx=(0, 5))
        self.difficulty_var = tk.StringVar(value="todos")
        difficulty_combo = ttk.Combobox(filter_frame, textvariable=self.difficulty_var,
                                       values=["todos", "basico", "intermedio", "avanzado"],
                                       width=12)
        difficulty_combo.grid(row=0, column=3, padx=(0, 20))

        ttk.Button(filter_frame, text="🔍 Filtrar",
                  command=self.filter_exercises).grid(row=0, column=4)

        # Frame del ejercicio
        exercise_frame = ttk.LabelFrame(main_frame, text="📝 Ejercicio Actual", padding="15")
        exercise_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        exercise_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(2, weight=1)

        # Información del ejercicio
        info_frame = ttk.Frame(exercise_frame)
        info_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        info_frame.columnconfigure(2, weight=1)

        self.exercise_counter_label = ttk.Label(info_frame, text="Ejercicio: 0/0", font=('Arial', 10))
        self.exercise_counter_label.grid(row=0, column=0, sticky=tk.W)

        self.topic_difficulty_label = ttk.Label(info_frame, text="", font=('Arial', 10))
        self.topic_difficulty_label.grid(row=0, column=1, padx=(20, 0), sticky=tk.W)

        self.timer_label = ttk.Label(info_frame, text="⏱️ 00:00", font=('Arial', 10))
        self.timer_label.grid(row=0, column=3, sticky=tk.E)

        # Problema
        self.problem_label = ttk.Label(exercise_frame, text="Carga ejercicios para comenzar...",
                                      font=('Arial', 14), wraplength=600, justify=tk.CENTER)
        self.problem_label.grid(row=1, column=0, pady=20)

        # Frame de respuesta
        answer_frame = ttk.Frame(exercise_frame)
        answer_frame.grid(row=2, column=0, pady=10)

        ttk.Label(answer_frame, text="Tu respuesta:", font=('Arial', 12)).grid(row=0, column=0, padx=(0, 10))

        self.answer_var = tk.StringVar()
        self.answer_entry = ttk.Entry(answer_frame, textvariable=self.answer_var,
                                     font=('Arial', 12), width=20)
        self.answer_entry.grid(row=0, column=1, padx=(0, 10))
        self.answer_entry.bind('<Return>', lambda e: self.check_answer())

        ttk.Button(answer_frame, text="✅ Verificar",
                  command=self.check_answer).grid(row=0, column=2, padx=(0, 10))

        ttk.Button(answer_frame, text="💡 Pista",
                  command=self.show_hint).grid(row=0, column=3)

        # Resultado
        self.result_label = ttk.Label(exercise_frame, text="", font=('Arial', 12))
        self.result_label.grid(row=3, column=0, pady=10)

        # Pasos de solución (inicialmente ocultos)
        self.steps_frame = ttk.LabelFrame(exercise_frame, text="📋 Solución paso a paso", padding="10")

        self.steps_text = tk.Text(self.steps_frame, height=6, width=70, wrap=tk.WORD,
                                 font=('Arial', 10), state=tk.DISABLED)
        self.steps_text.grid(row=0, column=0)

        # Scrollbar para los pasos
        steps_scrollbar = ttk.Scrollbar(self.steps_frame, orient=tk.VERTICAL, command=self.steps_text.yview)
        steps_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.steps_text.configure(yscrollcommand=steps_scrollbar.set)

        # Botones de navegación
        nav_frame = ttk.Frame(exercise_frame)
        nav_frame.grid(row=5, column=0, pady=15)

        self.prev_button = ttk.Button(nav_frame, text="⬅️ Anterior",
                                     command=self.previous_exercise, state=tk.DISABLED)
        self.prev_button.grid(row=0, column=0, padx=(0, 10))

        self.next_button = ttk.Button(nav_frame, text="➡️ Siguiente",
                                     command=self.next_exercise, state=tk.DISABLED)
        self.next_button.grid(row=0, column=1, padx=(0, 10))

        ttk.Button(nav_frame, text="🔄 Reiniciar",
                  command=self.restart_session).grid(row=0, column=2)

        # Frame de estadísticas
        stats_frame = ttk.LabelFrame(main_frame, text="📊 Estadísticas", padding="10")
        stats_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E))

        self.stats_label = ttk.Label(stats_frame, text="", font=('Arial', 10))
        self.stats_label.grid(row=0, column=0)

        # Iniciar timer
        self.start_timer()

    def load_exercises_file(self):
        """Carga ejercicios desde un archivo JSON"""

        file_path = filedialog.askopenfilename(
            title="Seleccionar archivo de ejercicios",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Verificar estructura del archivo
                if 'exercises' in data:
                    # Archivo generado por training_data_generator
                    self.exercises = data['exercises']
                elif isinstance(data, list):
                    # Lista directa de ejercicios
                    self.exercises = data
                elif 'problem' in data:
                    # Ejercicio individual
                    self.exercises = [data]
                else:
                    messagebox.showerror("Error", "Formato de archivo no reconocido")
                    return

                # Limpiar ejercicios y prepararlos
                self.exercises = [ex for ex in self.exercises if 'problem' in ex and 'answer' in ex]

                if self.exercises:
                    self.current_exercise_index = 0
                    self.load_current_exercise()
                    self.update_navigation_buttons()
                    self.update_exercise_counter()
                    messagebox.showinfo("Éxito", f"Cargados {len(self.exercises)} ejercicios")
                else:
                    messagebox.showerror("Error", "No se encontraron ejercicios válidos en el archivo")

            except Exception as e:
                messagebox.showerror("Error", f"Error cargando archivo: {str(e)}")

    def generate_new_exercises(self):
        """Genera nuevos ejercicios usando el modelo de IA"""

        if not self.ai_model:
            messagebox.showerror("Error", "Modelo de IA no disponible")
            return

        # Ventana de configuración
        config_window = tk.Toplevel(self.root)
        config_window.title("🎲 Generar Ejercicios")
        config_window.geometry("400x300")
        config_window.resizable(False, False)

        # Centrar ventana
        config_window.transient(self.root)
        config_window.grab_set()

        frame = ttk.Frame(config_window, padding="20")
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text="🎲 Configuración de Generación",
                 font=('Arial', 14, 'bold')).pack(pady=(0, 20))

        # Cantidad
        ttk.Label(frame, text="Cantidad de ejercicios:").pack(anchor=tk.W)
        count_var = tk.StringVar(value="10")
        count_entry = ttk.Entry(frame, textvariable=count_var, width=10)
        count_entry.pack(anchor=tk.W, pady=(0, 10))

        # Tema
        ttk.Label(frame, text="Tema:").pack(anchor=tk.W)
        topic_var = tk.StringVar(value="aritmetica")
        topic_combo = ttk.Combobox(frame, textvariable=topic_var,
                                  values=["aritmetica", "algebra", "geometria", "fracciones"],
                                  state="readonly")
        topic_combo.pack(anchor=tk.W, pady=(0, 10))

        # Dificultad
        ttk.Label(frame, text="Dificultad:").pack(anchor=tk.W)
        diff_var = tk.StringVar(value="basico")
        diff_combo = ttk.Combobox(frame, textvariable=diff_var,
                                 values=["basico", "intermedio", "avanzado"],
                                 state="readonly")
        diff_combo.pack(anchor=tk.W, pady=(0, 20))

        # Botones
        button_frame = ttk.Frame(frame)
        button_frame.pack(fill=tk.X)

        def generate():
            try:
                count = int(count_var.get())
                if count < 1 or count > 50:
                    messagebox.showerror("Error", "La cantidad debe estar entre 1 y 50")
                    return

                # Generar ejercicios
                new_exercises = []
                user_profile = {'edad': 12, 'rendimiento': 0.7, 'preferencia_visual': 0.5}

                progress_window = tk.Toplevel(config_window)
                progress_window.title("Generando...")
                progress_window.geometry("300x100")

                progress_label = ttk.Label(progress_window, text="Generando ejercicios...")
                progress_label.pack(pady=20)

                progress_bar = ttk.Progressbar(progress_window, length=250, mode='determinate')
                progress_bar.pack(pady=10)
                progress_bar['maximum'] = count

                progress_window.update()

                for i in range(count):
                    exercise = self.ai_model.generate_validated_exercise(
                        topic_var.get(), diff_var.get(), user_profile
                    )
                    new_exercises.append(exercise)

                    progress_bar['value'] = i + 1
                    progress_label.config(text=f"Generando ejercicio {i+1}/{count}...")
                    progress_window.update()

                progress_window.destroy()
                config_window.destroy()

                # Agregar a la lista actual
                self.exercises.extend(new_exercises)

                if not hasattr(self, 'current_exercise') or self.current_exercise is None:
                    self.current_exercise_index = 0
                    self.load_current_exercise()

                self.update_navigation_buttons()
                self.update_exercise_counter()

                messagebox.showinfo("Éxito", f"Generados {len(new_exercises)} ejercicios nuevos")

            except ValueError:
                messagebox.showerror("Error", "La cantidad debe ser un número")
            except Exception as e:
                messagebox.showerror("Error", f"Error generando ejercicios: {str(e)}")

        ttk.Button(button_frame, text="✅ Generar", command=generate).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="❌ Cancelar", command=config_window.destroy).pack(side=tk.LEFT)

    def load_trained_model(self):
        """Intenta cargar un modelo entrenado"""
        try:
            # Buscar archivos de modelo en el directorio actual
            model_files = [f for f in os.listdir('.') if f.startswith('trained_hybrid_model') and f.endswith('.json')]

            if model_files:
                # Usar el más reciente
                latest_model = max(model_files, key=lambda x: os.path.getctime(x))
                self.ai_model.load_model(latest_model)
                print(f"✅ Modelo entrenado cargado: {latest_model}")
        except Exception as e:
            print(f"⚠️ No se pudo cargar modelo entrenado: {e}")

    def load_default_exercises(self):
        """Carga ejercicios de ejemplo si no hay ninguno"""

        if not self.exercises:
            # Crear algunos ejercicios de ejemplo
            default_exercises = [
                {
                    "id": "ejemplo_1",
                    "topic": "aritmetica",
                    "difficulty": "basico",
                    "problem": "Calcula: 15 + 23",
                    "answer": "38",
                    "steps": ["Sumamos 15 + 23", "15 + 23 = 38"],
                    "hints": ["Puedes contar hacia adelante desde 15"]
                },
                {
                    "id": "ejemplo_2",
                    "topic": "algebra",
                    "difficulty": "basico",
                    "problem": "Resuelve para x: x + 7 = 15",
                    "answer": "8",
                    "steps": ["x + 7 = 15", "x = 15 - 7", "x = 8"],
                    "hints": ["Pasa el 7 al otro lado restando"]
                },
                {
                    "id": "ejemplo_3",
                    "topic": "geometria",
                    "difficulty": "basico",
                    "problem": "Calcula el área de un rectángulo de 6 cm × 4 cm",
                    "answer": "24 cm²",
                    "steps": ["Área = largo × ancho", "Área = 6 × 4", "Área = 24 cm²"],
                    "hints": ["La fórmula del área del rectángulo es largo × ancho"]
                }
            ]

            self.exercises = default_exercises
            self.current_exercise_index = 0
            self.load_current_exercise()
            self.update_navigation_buttons()
            self.update_exercise_counter()

    def filter_exercises(self):
        """Filtra ejercicios por tema y dificultad"""

        if not self.exercises:
            return

        topic = self.topic_var.get()
        difficulty = self.difficulty_var.get()

        # Aplicar filtros
        filtered = self.exercises.copy()

        if topic != "todos":
            filtered = [ex for ex in filtered if ex.get('topic') == topic]

        if difficulty != "todos":
            filtered = [ex for ex in filtered if ex.get('difficulty') == difficulty]

        if filtered:
            self.exercises = filtered
            self.current_exercise_index = 0
            self.load_current_exercise()
            self.update_navigation_buttons()
            self.update_exercise_counter()
            messagebox.showinfo("Filtrado", f"Se encontraron {len(filtered)} ejercicios")
        else:
            messagebox.showwarning("Sin resultados", "No se encontraron ejercicios con esos filtros")

    def load_current_exercise(self):
        """Carga el ejercicio actual en la interfaz"""

        if not self.exercises or self.current_exercise_index >= len(self.exercises):
            return

        self.current_exercise = self.exercises[self.current_exercise_index]

        # Mostrar problema
        self.problem_label.config(text=self.current_exercise['problem'])

        # Mostrar tema y dificultad
        topic = self.current_exercise.get('topic', 'N/A').title()
        difficulty = self.current_exercise.get('difficulty', 'N/A').title()
        self.topic_difficulty_label.config(text=f"📚 {topic} - 🎚️ {difficulty}")

        # Limpiar respuesta anterior
        self.answer_var.set("")
        self.result_label.config(text="")

        # Ocultar pasos de solución
        self.steps_frame.grid_remove()

        # Enfocar en el campo de respuesta
        self.answer_entry.focus()

    def check_answer(self):
        """Verifica la respuesta del usuario"""

        if not self.current_exercise:
            return

        user_answer = self.answer_var.get().strip()
        if not user_answer:
            messagebox.showwarning("Respuesta vacía", "Por favor ingresa una respuesta")
            return

        correct_answer = str(self.current_exercise['answer']).strip()

        # Normalizar respuestas para comparación
        user_normalized = self.normalize_answer(user_answer)
        correct_normalized = self.normalize_answer(correct_answer)

        self.total_attempted += 1

        if user_normalized == correct_normalized:
            # Respuesta correcta
            self.score += 1
            self.session_stats['correct'] += 1
            self.result_label.config(text="✅ ¡Correcto! Excelente trabajo", foreground="green")

            # Mostrar pasos de solución
            self.show_solution_steps()

            # Habilitar botón siguiente
            self.next_button.config(state=tk.NORMAL)

        else:
            # Respuesta incorrecta
            self.session_stats['incorrect'] += 1
            self.result_label.config(
                text=f"❌ Incorrecto. La respuesta correcta es: {correct_answer}",
                foreground="red"
            )

            # Mostrar pasos de solución
            self.show_solution_steps()

        self.update_stats_display()

    def normalize_answer(self, answer: str) -> str:
        """Normaliza una respuesta para comparación"""

        # Quitar espacios y convertir a minúsculas
        normalized = answer.lower().strip()

        # Quitar caracteres especiales comunes pero mantener matemáticos importantes
        normalized = re.sub(r'[^\w\s\+\-\*\/\=\.\,\±\²\³\√]', '', normalized)

        # Normalizar espacios
        normalized = re.sub(r'\s+', ' ', normalized).strip()

        return normalized

    def show_hint(self):
        """Muestra una pista para el ejercicio actual"""

        if not self.current_exercise:
            return

        hints = self.current_exercise.get('hints', ['No hay pistas disponibles para este ejercicio'])
        hint = random.choice(hints)

        self.session_stats['hints_used'] += 1
        self.update_stats_display()

        messagebox.showinfo("💡 Pista", hint)

    def show_solution_steps(self):
        """Muestra los pasos de la solución"""

        if not self.current_exercise:
            return

        steps = self.current_exercise.get('steps', ['Solución no disponible'])

        # Mostrar frame de pasos
        self.steps_frame.grid(row=4, column=0, sticky=(tk.W, tk.E), pady=10)

        # Actualizar contenido
        self.steps_text.config(state=tk.NORMAL)
        self.steps_text.delete(1.0, tk.END)

        for i, step in enumerate(steps, 1):
            self.steps_text.insert(tk.END, f"{i}. {step}\n")

        self.steps_text.config(state=tk.DISABLED)

    def previous_exercise(self):
        """Navega al ejercicio anterior"""

        if self.current_exercise_index > 0:
            self.current_exercise_index -= 1
            self.load_current_exercise()
            self.update_navigation_buttons()
            self.update_exercise_counter()

    def next_exercise(self):
        """Navega al ejercicio siguiente"""

        if self.current_exercise_index < len(self.exercises) - 1:
            self.current_exercise_index += 1
            self.load_current_exercise()
            self.update_navigation_buttons()
            self.update_exercise_counter()
        else:
            # Último ejercicio - mostrar resumen
            self.show_session_summary()

    def update_navigation_buttons(self):
        """Actualiza el estado de los botones de navegación"""

        if not self.exercises:
            self.prev_button.config(state=tk.DISABLED)
            self.next_button.config(state=tk.DISABLED)
            return

        # Botón anterior
        if self.current_exercise_index > 0:
            self.prev_button.config(state=tk.NORMAL)
        else:
            self.prev_button.config(state=tk.DISABLED)

        # Botón siguiente
        if self.current_exercise_index < len(self.exercises) - 1:
            self.next_button.config(state=tk.NORMAL)
        else:
            self.next_button.config(text="🏁 Finalizar")

    def update_exercise_counter(self):
        """Actualiza el contador de ejercicios"""

        if self.exercises:
            current = self.current_exercise_index + 1
            total = len(self.exercises)
            self.exercise_counter_label.config(text=f"Ejercicio: {current}/{total}")
        else:
            self.exercise_counter_label.config(text="Ejercicio: 0/0")

    def update_stats_display(self):
        """Actualiza la visualización de estadísticas"""

        correct = self.session_stats['correct']
        incorrect = self.session_stats['incorrect']
        total = correct + incorrect
        hints = self.session_stats['hints_used']

        if total > 0:
            percentage = (correct / total) * 100
            stats_text = f"✅ Correctas: {correct} | ❌ Incorrectas: {incorrect} | 📊 Precisión: {percentage:.1f}% | 💡 Pistas: {hints}"
        else:
            stats_text = f"✅ Correctas: 0 | ❌ Incorrectas: 0 | 📊 Precisión: 0% | 💡 Pistas: 0"

        self.stats_label.config(text=stats_text)

    def start_timer(self):
        """Inicia el temporizador de la sesión"""
        self.update_timer()

    def update_timer(self):
        """Actualiza el temporizador cada segundo"""

        elapsed = datetime.now() - self.session_stats['start_time']
        minutes = int(elapsed.total_seconds() // 60)
        seconds = int(elapsed.total_seconds() % 60)

        self.timer_label.config(text=f"⏱️ {minutes:02d}:{seconds:02d}")

        # Actualizar cada segundo
        self.root.after(1000, self.update_timer)

    def restart_session(self):
        """Reinicia la sesión actual"""

        if messagebox.askyesno("Reiniciar", "¿Estás seguro de que quieres reiniciar la sesión?"):
            self.session_stats = {
                'correct': 0,
                'incorrect': 0,
                'hints_used': 0,
                'start_time': datetime.now()
            }

            if self.exercises:
                self.current_exercise_index = 0
                self.load_current_exercise()
                self.update_navigation_buttons()
                self.update_exercise_counter()

            self.update_stats_display()

    def show_session_summary(self):
        """Muestra un resumen de la sesión"""

        correct = self.session_stats['correct']
        incorrect = self.session_stats['incorrect']
        total = correct + incorrect
        hints = self.session_stats['hints_used']
        elapsed = datetime.now() - self.session_stats['start_time']

        # Ventana de resumen
        summary_window = tk.Toplevel(self.root)
        summary_window.title("🏆 Resumen de la Sesión")
        summary_window.geometry("500x400")
        summary_window.resizable(False, False)

        # Centrar ventana
        summary_window.transient(self.root)
        summary_window.grab_set()

        frame = ttk.Frame(summary_window, padding="20")
        frame.pack(fill=tk.BOTH, expand=True)

        # Título
        ttk.Label(frame, text="🏆 ¡Sesión Completada!",
                 font=('Arial', 16, 'bold')).pack(pady=(0, 20))

        # Estadísticas
        stats_frame = ttk.LabelFrame(frame, text="📊 Estadísticas", padding="15")
        stats_frame.pack(fill=tk.X, pady=(0, 20))

        if total > 0:
            percentage = (correct / total) * 100

            # Determinar nivel de rendimiento
            if percentage >= 90:
                level = "🏆 ¡EXCELENTE!"
                color = "green"
            elif percentage >= 70:
                level = "👍 ¡MUY BIEN!"
                color = "blue"
            elif percentage >= 50:
                level = "👌 BIEN"
                color = "orange"
            else:
                level = "📚 SIGUE PRACTICANDO"
                color = "red"

            ttk.Label(stats_frame, text=level, font=('Arial', 14, 'bold')).pack()

        else:
            percentage = 0
            level = "Sin intentos"

        stats_text = f"""
📝 Ejercicios intentados: {total}
✅ Respuestas correctas: {correct}
❌ Respuestas incorrectas: {incorrect}
📊 Precisión: {percentage:.1f}%
💡 Pistas utilizadas: {hints}
⏱️ Tiempo total: {int(elapsed.total_seconds() // 60):02d}:{int(elapsed.total_seconds() % 60):02d}
"""

        ttk.Label(stats_frame, text=stats_text, font=('Arial', 11)).pack()

        # Recomendaciones
        recommendations_frame = ttk.LabelFrame(frame, text="💡 Recomendaciones", padding="15")
        recommendations_frame.pack(fill=tk.X, pady=(0, 20))

        if percentage >= 80:
            rec_text = "¡Excelente trabajo! Estás listo para ejercicios más difíciles."
        elif percentage >= 60:
            rec_text = "Buen rendimiento. Practica un poco más para mejorar tu precisión."
        elif percentage >= 40:
            rec_text = "Vas por buen camino. Te recomendamos repasar los conceptos básicos."
        else:
            rec_text = "Sigue practicando. Los pasos de solución te ayudarán a entender mejor."

        ttk.Label(recommendations_frame, text=rec_text, wraplength=400, justify=tk.CENTER).pack()

        # Botones
        button_frame = ttk.Frame(frame)
        button_frame.pack(fill=tk.X)

        ttk.Button(button_frame, text="🔄 Nueva Sesión",
                  command=lambda: [summary_window.destroy(), self.restart_session()]).pack(side=tk.LEFT, padx=(0, 10))

        ttk.Button(button_frame, text="📊 Guardar Resultados",
                  command=lambda: [self.save_session_results(), summary_window.destroy()]).pack(side=tk.LEFT, padx=(0, 10))

        ttk.Button(button_frame, text="❌ Cerrar",
                  command=summary_window.destroy).pack(side=tk.RIGHT)

    def save_progress(self):
        """Guarda el progreso actual"""

        if not self.exercises:
            messagebox.showwarning("Sin datos", "No hay ejercicios para guardar")
            return

        file_path = filedialog.asksaveasfilename(
            title="Guardar progreso",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if file_path:
            try:
                progress_data = {
                    'exercises': self.exercises,
                    'current_index': self.current_exercise_index,
                    'session_stats': self.session_stats,
                    'saved_at': datetime.now().isoformat()
                }

                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(progress_data, f, indent=2, ensure_ascii=False, default=str)

                messagebox.showinfo("Éxito", f"Progreso guardado en: {file_path}")

            except Exception as e:
                messagebox.showerror("Error", f"Error guardando progreso: {str(e)}")

    def save_session_results(self):
        """Guarda los resultados de la sesión actual"""

        file_path = filedialog.asksaveasfilename(
            title="Guardar resultados de la sesión",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if file_path:
            try:
                correct = self.session_stats['correct']
                incorrect = self.session_stats['incorrect']
                total = correct + incorrect

                results_data = {
                    'session_summary': {
                        'date': datetime.now().isoformat(),
                        'total_exercises': len(self.exercises),
                        'attempted': total,
                        'correct': correct,
                        'incorrect': incorrect,
                        'accuracy': (correct / total * 100) if total > 0 else 0,
                        'hints_used': self.session_stats['hints_used'],
                        'duration_seconds': (datetime.now() - self.session_stats['start_time']).total_seconds()
                    },
                    'detailed_stats': self.session_stats,
                    'exercises_used': self.exercises
                }

                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(results_data, f, indent=2, ensure_ascii=False, default=str)

                messagebox.showinfo("Éxito", f"Resultados guardados en: {file_path}")

            except Exception as e:
                messagebox.showerror("Error", f"Error guardando resultados: {str(e)}")

def create_sample_exercises_file():
    """Crea un archivo de ejercicios de ejemplo para probar la aplicación"""

    sample_exercises = [
        {
            "id": "sample_1",
            "topic": "aritmetica",
            "difficulty": "basico",
            "problem": "Calcula: 25 + 17",
            "answer": "42",
            "steps": [
                "Sumamos 25 + 17",
                "25 + 17 = 42"
            ],
            "hints": ["Puedes usar los dedos para contar", "Empieza desde 25 y cuenta 17 hacia adelante"]
        },
        {
            "id": "sample_2",
            "topic": "aritmetica",
            "difficulty": "basico",
            "problem": "Calcula: 50 - 23",
            "answer": "27",
            "steps": [
                "Restamos 50 - 23",
                "50 - 23 = 27"
            ],
            "hints": ["Cuenta hacia atrás desde 50", "¿Cuánto necesitas quitar de 50 para llegar a 23?"]
        },
        {
            "id": "sample_3",
            "topic": "aritmetica",
            "difficulty": "intermedio",
            "problem": "Calcula: (15 + 8) × 3",
            "answer": "69",
            "steps": [
                "Primero resolvemos el paréntesis: 15 + 8 = 23",
                "Luego multiplicamos: 23 × 3 = 69"
            ],
            "hints": ["Recuerda resolver primero lo que está entre paréntesis", "Orden de operaciones: paréntesis primero"]
        },
        {
            "id": "sample_4",
            "topic": "algebra",
            "difficulty": "basico",
            "problem": "Resuelve para x: x + 12 = 25",
            "answer": "13",
            "steps": [
                "x + 12 = 25",
                "x = 25 - 12",
                "x = 13"
            ],
            "hints": ["Pasa el 12 al otro lado cambiando el signo", "¿Qué número más 12 da 25?"]
        },
        {
            "id": "sample_5",
            "topic": "geometria",
            "difficulty": "basico",
            "problem": "Calcula el área de un rectángulo de 8 cm de largo y 5 cm de ancho",
            "answer": "40 cm²",
            "steps": [
                "Área del rectángulo = largo × ancho",
                "Área = 8 × 5",
                "Área = 40 cm²"
            ],
            "hints": ["La fórmula es: largo × ancho", "Multiplica 8 por 5"]
        },
        {
            "id": "sample_6",
            "topic": "fracciones",
            "difficulty": "basico",
            "problem": "Calcula: 2/5 + 1/5",
            "answer": "3/5",
            "steps": [
                "Como tienen el mismo denominador, sumamos los numeradores:",
                "2 + 1 = 3",
                "Resultado: 3/5"
            ],
            "hints": ["Cuando el denominador es igual, solo sumas los de arriba", "2 + 1 = ?"]
        }
    ]

    filename = "ejercicios_ejemplo.json"

    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': {
                    'title': 'Ejercicios de ejemplo para MATH_M1M',
                    'created_at': datetime.now().isoformat(),
                    'total_exercises': len(sample_exercises)
                },
                'exercises': sample_exercises
            }, f, indent=2, ensure_ascii=False)

        print(f"✅ Archivo de ejercicios de ejemplo creado: {filename}")
        return filename

    except Exception as e:
        print(f"❌ Error creando archivo de ejemplo: {e}")
        return None

def main():
    """Función principal para ejecutar la aplicación"""

    print("🚀 INICIANDO APLICACIÓN GUI MATH_M1M")
    print("=" * 50)

    # Verificar si existe un archivo de ejercicios de ejemplo
    if not os.path.exists("ejercicios_ejemplo.json"):
        print("📝 Creando archivo de ejercicios de ejemplo...")
        create_sample_exercises_file()

    # Crear ventana principal
    root = tk.Tk()

    # Configurar estilo
    style = ttk.Style()
    style.theme_use('clam')  # Tema moderno

    # Crear aplicación
    app = ExerciseGameGUI(root)

    print("✅ Aplicación iniciada!")
    print("💡 Consejos:")
    print("   - Carga ejercicios con el botón '📂 Cargar Ejercicios'")
    print("   - Usa '🎲 Generar Nuevos' si tienes el modelo entrenado")
    print("   - Presiona Enter para verificar respuestas rápidamente")
    print("   - Usa el botón '💡 Pista' si necesitas ayuda")

    # Iniciar loop principal
    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("\n👋 Aplicación cerrada por el usuario")
    except Exception as e:
        print(f"\n❌ Error en la aplicación: {e}")

if __name__ == "__main__":
    main()