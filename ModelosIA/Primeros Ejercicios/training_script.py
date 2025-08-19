"""
SCRIPT DE ENTRENAMIENTO DEL MODELO HÍBRIDO - VERSIÓN COMPLETA
Entrena la red neuronal con datos sintéticos y evalúa el sistema completo
"""

import json
import numpy as np
import os
from datetime import datetime
from typing import List, Dict, Tuple

# Verificar e importar dependencias
print("🔄 Verificando dependencias...")

# Verificar matplotlib
try:
    import matplotlib.pyplot as plt

    matplotlib_available = True
    print("✅ Matplotlib disponible")
except ImportError:
    matplotlib_available = False
    print("⚠️ Matplotlib no disponible - las gráficas no funcionarán")
    print("💡 Instala con: pip install matplotlib")

# Verificar TensorFlow
try:
    import tensorflow as tf

    print(f"✅ TensorFlow {tf.__version__} disponible")
    tf.get_logger().setLevel('ERROR')
except ImportError:
    print("❌ Error: TensorFlow no está instalado")
    print("💡 Instala con: pip install tensorflow")
    exit(1)

# Importar nuestros módulos
try:
    from hybrid_model import HybridMathModel
    from training_data_generator import TrainingDataGenerator

    print("✅ Módulos del proyecto importados correctamente")
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("💡 Asegúrate de tener los archivos:")
    print("   - hybrid_model.py")
    print("   - training_data_generator.py")
    print("   - training_script.py (este archivo)")
    exit(1)


class ModelTrainer:
    """
    Entrenador del modelo híbrido con evaluación completa
    """

    def __init__(self):
        self.model = HybridMathModel()
        self.data_generator = TrainingDataGenerator()
        self.training_history = {}
        self.evaluation_results = {}

    def prepare_training_data(self, dataset: List[Dict]) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepara los datos del dataset para el entrenamiento de la red neuronal
        """
        print("🔄 Preparando datos para entrenamiento...")

        X_tema = []
        X_dificultad = []
        X_usuario = []
        y_tokens = []

        # Tamaño del vocabulario (debe coincidir con el modelo)
        vocab_size = self.model.neural_generator.vocab_size

        for exercise in dataset:
            metadata = exercise.get('training_metadata', {})

            # Entradas
            X_tema.append(metadata.get('topic_encoded', 0))
            X_dificultad.append(metadata.get('difficulty_encoded', 0))

            # Perfil de usuario
            user_profile = metadata.get('user_profile_sample', {})
            edad_norm = (user_profile.get('edad', 12) - 8) / 8  # Normalizar edad
            rendimiento = user_profile.get('rendimiento', 0.5)
            preferencia = user_profile.get('preferencia_visual', 0.5)
            X_usuario.append([edad_norm, rendimiento, preferencia])

            # Target (tokens de salida)
            target_tokens = metadata.get('target_tokens', [0])
            # Crear vector one-hot para el primer token (simplificado)
            target_vector = np.zeros(vocab_size)
            if target_tokens and len(target_tokens) > 0:
                first_token = target_tokens[0]
                if first_token < vocab_size:
                    target_vector[first_token] = 1.0
                else:
                    target_vector[0] = 1.0  # Padding token
            else:
                target_vector[0] = 1.0

            y_tokens.append(target_vector)

        # Convertir a arrays numpy
        X_tema = np.array(X_tema).reshape(-1, 1)
        X_dificultad = np.array(X_dificultad).reshape(-1, 1)
        X_usuario = np.array(X_usuario)
        y_tokens = np.array(y_tokens)

        print(f"✅ Datos preparados:")
        print(f"   Muestras: {len(X_tema)}")
        print(f"   Forma X_tema: {X_tema.shape}")
        print(f"   Forma X_dificultad: {X_dificultad.shape}")
        print(f"   Forma X_usuario: {X_usuario.shape}")
        print(f"   Forma y_tokens: {y_tokens.shape}")

        return X_tema, X_dificultad, X_usuario, y_tokens

    def train_model(self, dataset_file: str = None, epochs: int = 50, batch_size: int = 32) -> Dict:
        """
        Entrena el modelo completo
        """

        print("🎓 INICIANDO ENTRENAMIENTO DEL MODELO HÍBRIDO")
        print("=" * 60)

        # Paso 1: Obtener dataset
        if dataset_file and os.path.exists(dataset_file):
            print(f"📂 Cargando dataset existente: {dataset_file}")
            dataset, metadata = self.data_generator.load_dataset(dataset_file)
        else:
            print("📊 Generando nuevo dataset de entrenamiento...")
            dataset = self.data_generator.generate_training_dataset(samples_per_topic=200)
            dataset_file = self.data_generator.save_dataset(dataset)

        if not dataset:
            print("❌ Error: No se pudo obtener dataset para entrenamiento")
            return {}

        # Paso 2: Preparar datos
        X_tema, X_dificultad, X_usuario, y_tokens = self.prepare_training_data(dataset)

        # Paso 3: Construir modelo si no existe
        if self.model.neural_generator.model is None:
            print("🏗️ Construyendo arquitectura de red neuronal...")
            self.model.neural_generator.build_model()
            print("✅ Modelo construido!")

            # Mostrar resumen del modelo
            try:
                print("\n📋 Resumen del modelo:")
                self.model.neural_generator.model.summary()
            except:
                print("   (Resumen no disponible)")

        # Paso 4: Entrenar red neuronal
        print(f"\n🧠 Entrenando red neuronal...")
        print(f"   Épocas: {epochs}")
        print(f"   Batch size: {batch_size}")
        print(f"   Muestras de entrenamiento: {len(X_tema)}")

        try:
            history = self.model.neural_generator.model.fit(
                [X_tema, X_dificultad, X_usuario],
                y_tokens,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                verbose=1,
                shuffle=True
            )

            # Marcar como entrenado
            self.model.neural_generator.is_trained = True

            # Guardar historial
            self.training_history = {
                'loss': history.history['loss'],
                'accuracy': history.history.get('accuracy', []),
                'val_loss': history.history.get('val_loss', []),
                'val_accuracy': history.history.get('val_accuracy', []),
                'epochs': epochs,
                'batch_size': batch_size,
                'total_samples': len(X_tema),
                'dataset_file': dataset_file,
                'trained_at': datetime.now().isoformat()
            }

            print("✅ Entrenamiento completado!")

            # Paso 5: Evaluar modelo
            self.evaluate_model(dataset[:100])  # Evaluar con subset

            return self.training_history

        except Exception as e:
            print(f"❌ Error durante entrenamiento: {e}")
            return {}

    def evaluate_model(self, test_dataset: List[Dict]) -> Dict:
        """
        Evalúa el modelo híbrido entrenado
        """
        print("\n🔍 EVALUANDO MODELO ENTRENADO")
        print("-" * 40)

        evaluation_results = {
            'total_tests': len(test_dataset),
            'successful_generations': 0,
            'validation_success_rate': 0.0,
            'average_confidence': 0.0,
            'average_attempts': 0.0,
            'topic_performance': {},
            'difficulty_performance': {},
            'errors': []
        }

        confidences = []
        attempts_list = []

        # Probar generación con diferentes parámetros
        test_scenarios = [
            ('aritmetica', 'basico'),
            ('aritmetica', 'intermedio'),
            ('algebra', 'basico'),
            ('algebra', 'intermedio'),
            ('geometria', 'basico'),
            ('fracciones', 'basico')
        ]

        print("Probando generación de ejercicios...")

        for i, (topic, difficulty) in enumerate(test_scenarios):
            print(f"  {i + 1}. {topic} - {difficulty}...", end="")

            try:
                # Perfil de usuario de prueba
                user_profile = {
                    'edad': 12,
                    'rendimiento': 0.7,
                    'preferencia_visual': 0.5
                }

                # Generar ejercicio
                exercise = self.model.generate_validated_exercise(
                    topic, difficulty, user_profile, max_attempts=3
                )

                # Analizar resultado
                validation = exercise.get('validation', {})
                is_valid = validation.get('is_valid', False)
                confidence = validation.get('confidence', 0.0)
                attempts = validation.get('attempts_needed', 0)

                if is_valid:
                    evaluation_results['successful_generations'] += 1
                    confidences.append(confidence)

                    if isinstance(attempts, int):
                        attempts_list.append(attempts)

                    print(" ✅")
                else:
                    print(" ❌")
                    evaluation_results['errors'].append(f"{topic}-{difficulty}: {validation.get('errors', [])}")

                # Estadísticas por tema
                if topic not in evaluation_results['topic_performance']:
                    evaluation_results['topic_performance'][topic] = {'success': 0, 'total': 0}

                evaluation_results['topic_performance'][topic]['total'] += 1
                if is_valid:
                    evaluation_results['topic_performance'][topic]['success'] += 1

                # Estadísticas por dificultad
                if difficulty not in evaluation_results['difficulty_performance']:
                    evaluation_results['difficulty_performance'][difficulty] = {'success': 0, 'total': 0}

                evaluation_results['difficulty_performance'][difficulty]['total'] += 1
                if is_valid:
                    evaluation_results['difficulty_performance'][difficulty]['success'] += 1

            except Exception as e:
                print(f" ❌ Error: {e}")
                evaluation_results['errors'].append(f"{topic}-{difficulty}: {str(e)}")

        # Calcular métricas finales
        total_scenarios = len(test_scenarios)
        evaluation_results['validation_success_rate'] = (
                evaluation_results['successful_generations'] / total_scenarios
        ) if total_scenarios > 0 else 0.0

        evaluation_results['average_confidence'] = (
                sum(confidences) / len(confidences)
        ) if confidences else 0.0

        evaluation_results['average_attempts'] = (
                sum(attempts_list) / len(attempts_list)
        ) if attempts_list else 0.0

        # Mostrar resultados
        print(f"\n📊 RESULTADOS DE EVALUACIÓN:")
        print(f"   ✅ Generaciones exitosas: {evaluation_results['successful_generations']}/{total_scenarios}")
        print(f"   📈 Tasa de éxito: {evaluation_results['validation_success_rate']:.2%}")
        print(f"   🎯 Confianza promedio: {evaluation_results['average_confidence']:.2f}")
        print(f"   🔄 Intentos promedio: {evaluation_results['average_attempts']:.1f}")

        print(f"\n📚 Rendimiento por tema:")
        for topic, stats in evaluation_results['topic_performance'].items():
            success_rate = stats['success'] / stats['total'] if stats['total'] > 0 else 0
            print(f"   {topic}: {stats['success']}/{stats['total']} ({success_rate:.1%})")

        print(f"\n🎚️ Rendimiento por dificultad:")
        for difficulty, stats in evaluation_results['difficulty_performance'].items():
            success_rate = stats['success'] / stats['total'] if stats['total'] > 0 else 0
            print(f"   {difficulty}: {stats['success']}/{stats['total']} ({success_rate:.1%})")

        if evaluation_results['errors']:
            print(f"\n⚠️ Errores encontrados:")
            for error in evaluation_results['errors'][:3]:  # Mostrar solo primeros 3
                print(f"   {error}")

        self.evaluation_results = evaluation_results
        return evaluation_results

    def plot_training_history(self, save_plot: bool = True):
        """
        Grafica el historial de entrenamiento
        """
        if not matplotlib_available:
            print("❌ Matplotlib no está disponible para crear gráficas")
            return

        if not self.training_history:
            print("❌ No hay historial de entrenamiento para graficar")
            return

        try:
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 8))

            epochs = range(1, len(self.training_history['loss']) + 1)

            # Loss
            ax1.plot(epochs, self.training_history['loss'], 'b-', label='Training Loss')
            if 'val_loss' in self.training_history and self.training_history['val_loss']:
                ax1.plot(epochs, self.training_history['val_loss'], 'r-', label='Validation Loss')
            ax1.set_title('Model Loss')
            ax1.set_xlabel('Epoch')
            ax1.set_ylabel('Loss')
            ax1.legend()
            ax1.grid(True)

            # Accuracy
            if 'accuracy' in self.training_history and self.training_history['accuracy']:
                ax2.plot(epochs, self.training_history['accuracy'], 'b-', label='Training Accuracy')
                if 'val_accuracy' in self.training_history and self.training_history['val_accuracy']:
                    ax2.plot(epochs, self.training_history['val_accuracy'], 'r-', label='Validation Accuracy')
                ax2.set_title('Model Accuracy')
                ax2.set_xlabel('Epoch')
                ax2.set_ylabel('Accuracy')
                ax2.legend()
                ax2.grid(True)
            else:
                ax2.text(0.5, 0.5, 'No accuracy data available',
                         horizontalalignment='center', verticalalignment='center',
                         transform=ax2.transAxes)
                ax2.set_title('Model Accuracy (No Data)')

            # Evaluation Results
            if self.evaluation_results:
                topics = list(self.evaluation_results['topic_performance'].keys())
                success_rates = [
                    self.evaluation_results['topic_performance'][topic]['success'] /
                    self.evaluation_results['topic_performance'][topic]['total']
                    for topic in topics
                ]

                ax3.bar(topics, success_rates, color='green', alpha=0.7)
                ax3.set_title('Success Rate by Topic')
                ax3.set_ylabel('Success Rate')
                ax3.set_ylim(0, 1)
                plt.setp(ax3.get_xticklabels(), rotation=45)

                # Difficulty performance
                difficulties = list(self.evaluation_results['difficulty_performance'].keys())
                diff_success_rates = [
                    self.evaluation_results['difficulty_performance'][diff]['success'] /
                    self.evaluation_results['difficulty_performance'][diff]['total']
                    for diff in difficulties
                ]

                ax4.bar(difficulties, diff_success_rates, color='blue', alpha=0.7)
                ax4.set_title('Success Rate by Difficulty')
                ax4.set_ylabel('Success Rate')
                ax4.set_ylim(0, 1)
            else:
                ax3.text(0.5, 0.5, 'No evaluation data',
                         horizontalalignment='center', verticalalignment='center',
                         transform=ax3.transAxes)
                ax4.text(0.5, 0.5, 'No evaluation data',
                         horizontalalignment='center', verticalalignment='center',
                         transform=ax4.transAxes)

            plt.tight_layout()

            if save_plot:
                plot_filename = f"training_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
                print(f"📊 Gráfica guardada: {plot_filename}")

            plt.show()

        except Exception as e:
            print(f"❌ Error creando gráfica: {e}")

    def save_trained_model(self, model_filename: str = None):
        """
        Guarda el modelo entrenado con todos los metadatos
        """
        if model_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_filename = f"trained_hybrid_model_{timestamp}.json"

        # Guardar modelo
        self.model.save_model(model_filename)

        # Guardar historial de entrenamiento y evaluación
        training_data = {
            'training_history': self.training_history,
            'evaluation_results': self.evaluation_results,
            'model_stats': self.model.get_model_stats(),
            'saved_at': datetime.now().isoformat()
        }

        training_filename = model_filename.replace('.json', '_training_data.json')
        with open(training_filename, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Modelo completo guardado:")
        print(f"   📋 Modelo: {model_filename}")
        print(f"   📊 Datos de entrenamiento: {training_filename}")

        return model_filename, training_filename

    def generate_training_report(self) -> str:
        """
        Genera un reporte completo del entrenamiento
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"training_report_{timestamp}.md"

        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write("# 🎓 REPORTE DE ENTRENAMIENTO - MODELO HÍBRIDO MATH_M1M\n\n")
            f.write(f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Información del entrenamiento
            if self.training_history:
                f.write("## 📊 Información del Entrenamiento\n\n")
                f.write(f"- **Épocas:** {self.training_history.get('epochs', 'N/A')}\n")
                f.write(f"- **Batch Size:** {self.training_history.get('batch_size', 'N/A')}\n")
                f.write(f"- **Muestras totales:** {self.training_history.get('total_samples', 'N/A')}\n")
                f.write(f"- **Dataset:** {self.training_history.get('dataset_file', 'N/A')}\n\n")

                # Métricas finales
                if self.training_history.get('loss'):
                    final_loss = self.training_history['loss'][-1]
                    f.write(f"- **Loss final:** {final_loss:.4f}\n")

                if self.training_history.get('val_loss'):
                    final_val_loss = self.training_history['val_loss'][-1]
                    f.write(f"- **Validation Loss final:** {final_val_loss:.4f}\n")

                f.write("\n")

            # Resultados de evaluación
            if self.evaluation_results:
                f.write("## 🔍 Resultados de Evaluación\n\n")
                f.write(f"- **Tasa de éxito:** {self.evaluation_results['validation_success_rate']:.2%}\n")
                f.write(f"- **Confianza promedio:** {self.evaluation_results['average_confidence']:.2f}\n")
                f.write(f"- **Intentos promedio:** {self.evaluation_results['average_attempts']:.1f}\n\n")

                # Performance por tema
                f.write("### 📚 Rendimiento por Tema\n\n")
                for topic, stats in self.evaluation_results['topic_performance'].items():
                    success_rate = stats['success'] / stats['total'] if stats['total'] > 0 else 0
                    f.write(f"- **{topic.title()}:** {stats['success']}/{stats['total']} ({success_rate:.1%})\n")

                f.write("\n### 🎚️ Rendimiento por Dificultad\n\n")
                for difficulty, stats in self.evaluation_results['difficulty_performance'].items():
                    success_rate = stats['success'] / stats['total'] if stats['total'] > 0 else 0
                    f.write(f"- **{difficulty.title()}:** {stats['success']}/{stats['total']} ({success_rate:.1%})\n")

                f.write("\n")

            # Estadísticas del modelo
            model_stats = self.model.get_model_stats()
            f.write("## 🤖 Estadísticas del Modelo\n\n")
            f.write(f"- **Ejercicios generados:** {model_stats['generation_stats']['total_generated']}\n")
            f.write(f"- **Validaciones exitosas:** {model_stats['generation_stats']['successful_validations']}\n")
            f.write(
                f"- **Red neuronal entrenada:** {'✅ Sí' if model_stats['neural_status']['is_trained'] else '❌ No'}\n")
            f.write(f"- **Tamaño de vocabulario:** {model_stats['neural_status']['vocab_size']}\n\n")

            # Conclusiones
            f.write("## 📝 Conclusiones\n\n")
            if self.evaluation_results:
                success_rate = self.evaluation_results['validation_success_rate']
                if success_rate > 0.8:
                    f.write("✅ **Excelente:** El modelo muestra un rendimiento muy bueno.\n")
                elif success_rate > 0.6:
                    f.write("🟡 **Bueno:** El modelo funciona bien pero puede mejorarse.\n")
                else:
                    f.write("🔴 **Necesita mejoras:** El modelo requiere más entrenamiento.\n")

            f.write("\n## 🎯 Recomendaciones\n\n")
            f.write("1. **Continuar entrenamiento** con más datos si la tasa de éxito es baja\n")
            f.write("2. **Ajustar hiperparámetros** (learning rate, batch size) para optimizar\n")
            f.write("3. **Expandir dataset** con más variedad de ejercicios\n")
            f.write("4. **Integrar al proyecto** MATH_M1M para pruebas en producción\n")

        print(f"📄 Reporte generado: {report_filename}")
        return report_filename


def verify_system_requirements():
    """
    Verifica que todos los requisitos del sistema estén listos
    """
    print("🔍 VERIFICANDO REQUISITOS DEL SISTEMA")
    print("-" * 40)

    requirements_met = True

    # Verificar Python
    import sys
    python_version = sys.version_info
    print(f"🐍 Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
    if python_version < (3, 7):
        print("❌ Se requiere Python 3.7 o superior")
        requirements_met = False
    else:
        print("✅ Versión de Python OK")

    # Verificar TensorFlow
    try:
        print(f"🧠 TensorFlow: {tf.__version__}")

        # Verificar GPU (opcional)
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print(f"🚀 GPU disponible: {len(gpus)} dispositivo(s)")
        else:
            print("💻 Usando CPU (más lento pero funcional)")

        print("✅ TensorFlow OK")
    except Exception as e:
        print(f"❌ TensorFlow error: {e}")
        requirements_met = False

    # Verificar NumPy
    try:
        import numpy as np
        print(f"🔢 NumPy: {np.__version__}")
        print("✅ NumPy OK")
    except ImportError:
        print("❌ NumPy no está disponible")
        requirements_met = False

    # Verificar espacio en disco
    import shutil
    try:
        free_space_gb = shutil.disk_usage('.').free / (1024 ** 3)
        print(f"💾 Espacio libre: {free_space_gb:.1f} GB")
        if free_space_gb < 1:
            print("⚠️ Poco espacio en disco - se recomienda al menos 1GB")
        else:
            print("✅ Espacio en disco OK")
    except Exception:
        print("💾 No se pudo verificar espacio en disco")

    # Verificar memoria (estimación)
    try:
        import psutil
        memory_gb = psutil.virtual_memory().total / (1024 ** 3)
        print(f"🧠 RAM total: {memory_gb:.1f} GB")
        if memory_gb < 4:
            print("⚠️ Poca RAM - el entrenamiento puede ser lento")
        else:
            print("✅ RAM suficiente")
    except ImportError:
        print("💡 Para verificar RAM instala: pip install psutil")
    except Exception:
        print("🧠 No se pudo verificar RAM")

    print("-" * 40)
    if requirements_met:
        print("✅ Todos los requisitos críticos están listos")
    else:
        print("❌ Algunos requisitos críticos no se cumplen")
        print("💡 Instala las dependencias faltantes antes de continuar")

    return requirements_met


def quick_model_test():
    """
    Hace una prueba rápida del modelo antes del entrenamiento completo
    """
    print("\n🧪 PRUEBA RÁPIDA DEL MODELO")
    print("-" * 30)

    try:
        # Crear modelo
        model = HybridMathModel()
        print("✅ Modelo híbrido creado")

        # Probar generación básica (sin entrenar)
        user_profile = {'edad': 12, 'rendimiento': 0.5, 'preferencia_visual': 0.5}
        exercise = model.generate_validated_exercise('aritmetica', 'basico', user_profile)

        print("✅ Generación básica funciona")
        print(f"   Problema: {exercise['problem']}")
        print(f"   Respuesta: {exercise['answer']}")

        # Verificar sistema experto
        validation = exercise.get('validation', {})
        if validation.get('is_valid'):
            print("✅ Sistema experto funciona")
        else:
            print("⚠️ Sistema experto encontró errores")

        return True

    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_trained_model(model: HybridMathModel):
    """
    Prueba interactiva del modelo entrenado
    """
    print(f"\n🧪 PRUEBA INTERACTIVA DEL MODELO")
    print("-" * 40)

    usuario_prueba = {
        'edad': 12,
        'rendimiento': 0.7,
        'preferencia_visual': 0.5
    }

    while True:
        print(f"\nTemas disponibles: aritmetica, algebra, geometria, fracciones")
        tema = input("Elige un tema (o 'salir'): ").strip().lower()

        if tema == 'salir':
            break

        if tema not in ['aritmetica', 'algebra', 'geometria', 'fracciones']:
            print("❌ Tema no válido")
            continue

        print("Dificultades: basico, intermedio, avanzado")
        dificultad = input("Elige dificultad: ").strip().lower()

        if dificultad not in ['basico', 'intermedio', 'avanzado']:
            print("❌ Dificultad no válida")
            continue

        print(f"\n🎲 Generando ejercicio de {tema} - {dificultad}...")

        try:
            ejercicio = model.generate_validated_exercise(tema, dificultad, usuario_prueba)

            print(f"\n📝 EJERCICIO GENERADO:")
            print(f"🔢 {ejercicio['problem']}")
            print(f"✅ Respuesta: {ejercicio['answer']}")

            # Mostrar pasos si están disponibles
            if 'steps' in ejercicio and ejercicio['steps']:
                print(f"📋 Pasos de solución:")
                for i, step in enumerate(ejercicio['steps'], 1):
                    print(f"   {i}. {step}")

            validation = ejercicio.get('validation', {})
            print(f"🔍 Válido: {'✅' if validation.get('is_valid') else '❌'}")
            print(f"📊 Confianza: {validation.get('confidence', 0):.2f}")
            print(f"🎯 Intentos: {validation.get('attempts_needed', 'N/A')}")

        except Exception as e:
            print(f"❌ Error generando ejercicio: {e}")


def main():
    """
    Función principal para entrenar el modelo
    """
    print("🎓 ENTRENAMIENTO DEL MODELO HÍBRIDO MATH_M1M")
    print("=" * 60)

    # Crear entrenador
    trainer = ModelTrainer()

    # Parámetros de entrenamiento
    print("\n⚙️ Configuración del entrenamiento:")
    print("1. ¿Cuántas épocas de entrenamiento? (recomendado: 20-50)")
    try:
        epochs = int(input("Épocas: ") or "30")
        if epochs < 1:
            epochs = 30
    except ValueError:
        epochs = 30
        print(f"Valor inválido, usando por defecto: {epochs}")

    print("2. ¿Tamaño del batch? (recomendado: 16-64)")
    try:
        batch_size = int(input("Batch size: ") or "32")
        if batch_size < 1:
            batch_size = 32
    except ValueError:
        batch_size = 32
        print(f"Valor inválido, usando por defecto: {batch_size}")

    print("3. ¿Usar dataset existente? (archivo .json)")
    dataset_file = input("Archivo dataset (Enter para generar nuevo): ").strip()
    if not dataset_file:
        dataset_file = None
    elif not os.path.exists(dataset_file):
        print(f"⚠️ Archivo no encontrado: {dataset_file}")
        print("Se generará un nuevo dataset")
        dataset_file = None

    print(f"\n🚀 Configuración final:")
    print(f"   Épocas: {epochs}")
    print(f"   Batch size: {batch_size}")
    print(f"   Dataset: {'Nuevo' if not dataset_file else dataset_file}")

    input("\nPresiona ENTER para continuar...")

    # Entrenar modelo
    print(f"\n🎯 Iniciando entrenamiento...")
    history = trainer.train_model(
        dataset_file=dataset_file,
        epochs=epochs,
        batch_size=batch_size
    )

    if history:
        print(f"\n✅ ENTRENAMIENTO COMPLETADO!")

        # Generar visualizaciones
        print(f"\n📊 Generando gráficas...")
        try:
            trainer.plot_training_history()
        except Exception as e:
            print(f"⚠️ Error generando gráficas: {e}")

        # Guardar modelo
        print(f"\n💾 Guardando modelo entrenado...")
        try:
            model_file, training_file = trainer.save_trained_model()
        except Exception as e:
            print(f"❌ Error guardando modelo: {e}")
            model_file, training_file = None, None

        # Generar reporte
        print(f"\n📄 Generando reporte...")
        try:
            report_file = trainer.generate_training_report()
        except Exception as e:
            print(f"❌ Error generando reporte: {e}")
            report_file = None

        print(f"\n🎉 ¡PROCESO COMPLETADO!")
        print(f"📁 Archivos generados:")
        if model_file:
            print(f"   🤖 Modelo: {model_file}")
        if training_file:
            print(f"   📊 Datos: {training_file}")
        if report_file:
            print(f"   📄 Reporte: {report_file}")

        # Mostrar estadísticas finales
        if trainer.evaluation_results:
            print(f"\n📈 RESUMEN DE RENDIMIENTO:")
            success_rate = trainer.evaluation_results['validation_success_rate']
            print(f"   📊 Tasa de éxito: {success_rate:.1%}")
            print(f"   🎯 Confianza promedio: {trainer.evaluation_results['average_confidence']:.2f}")

            if success_rate > 0.8:
                print("   🎉 ¡Excelente rendimiento!")
            elif success_rate > 0.6:
                print("   👍 Buen rendimiento")
            else:
                print("   📚 Necesita más entrenamiento")

        # Probar modelo entrenado
        print(f"\n🧪 ¿Quieres probar el modelo entrenado? (s/n): ", end="")
        if input().lower() in ['s', 'si', 'sí', 'y', 'yes']:
            test_trained_model(trainer.model)

    else:
        print(f"\n❌ Error en el entrenamiento")
        print("💡 Verifica:")
        print("   - Que todos los archivos estén en la misma carpeta")
        print("   - Que TensorFlow esté instalado correctamente")
        print("   - Que tengas suficiente memoria disponible")


if __name__ == "__main__":
    print("🚀 INICIANDO SISTEMA DE ENTRENAMIENTO")
    print("=" * 50)

    # Verificar requisitos primero
    print("Paso 1: Verificando requisitos del sistema...")
    if not verify_system_requirements():
        print("\n❌ Por favor resuelve los problemas de requisitos antes de continuar")
        print("💡 Dependencias mínimas:")
        print("   pip install tensorflow numpy")
        print("   pip install matplotlib  # (opcional, para gráficas)")
        exit(1)

    # Prueba rápida
    print("\nPaso 2: Probando el modelo...")
    if not quick_model_test():
        print("\n❌ Prueba del modelo falló. Verifica los archivos.")
        print("💡 Asegúrate de tener:")
        print("   - hybrid_model.py")
        print("   - training_data_generator.py")
        print("   - training_script.py")
        exit(1)

    print("\n✅ Todas las verificaciones pasaron!")
    print("🎓 Procediendo con el entrenamiento...\n")

    # Proceder con entrenamiento
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Entrenamiento interrumpido por el usuario")
        print("💾 Los datos parciales pueden haberse guardado")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback

        traceback.print_exc()
        print("\n💡 Si el error persiste, verifica:")
        print("   - Versiones de las dependencias")
        print("   - Espacio disponible en disco")
        print("   - Memoria RAM disponible")