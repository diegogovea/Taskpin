"""
GENERADOR DE DATOS DE ENTRENAMIENTO
Crea dataset sintético para entrenar la red neuronal del modelo híbrido
"""

import json
import random
import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple
import math


class TrainingDataGenerator:
    """
    Genera datos de entrenamiento sintéticos para el modelo híbrido
    """

    def __init__(self):
        self.exercise_templates = {
            'aritmetica': self._create_arithmetic_templates(),
            'algebra': self._create_algebra_templates(),
            'geometria': self._create_geometry_templates(),
            'fracciones': self._create_fraction_templates()
        }

        self.difficulty_ranges = {
            'basico': {'min': 1, 'max': 20},
            'intermedio': {'min': 10, 'max': 100},
            'avanzado': {'min': 50, 'max': 500}
        }

    def generate_training_dataset(self, samples_per_topic: int = 500) -> List[Dict]:
        """
        Genera un dataset completo de entrenamiento

        Args:
            samples_per_topic: Número de ejercicios por tema y dificultad

        Returns:
            Lista de ejercicios estructurados para entrenamiento
        """

        print(f"📊 Generando dataset de entrenamiento...")
        print(f"   {samples_per_topic} ejercicios por tema y dificultad")

        dataset = []
        topics = ['aritmetica', 'algebra', 'geometria', 'fracciones']
        difficulties = ['basico', 'intermedio', 'avanzado']

        total_exercises = len(topics) * len(difficulties) * samples_per_topic
        current_count = 0

        for topic in topics:
            for difficulty in difficulties:
                print(f"   🔄 Generando {topic} - {difficulty}...")

                for i in range(samples_per_topic):
                    exercise = self._generate_exercise_sample(topic, difficulty)
                    dataset.append(exercise)
                    current_count += 1

                    if current_count % 100 == 0:
                        progress = (current_count / total_exercises) * 100
                        print(f"      Progreso: {progress:.1f}%")

        print(f"✅ Dataset generado: {len(dataset)} ejercicios")
        return dataset

    def _generate_exercise_sample(self, topic: str, difficulty: str) -> Dict:
        """Genera un ejercicio individual para entrenamiento"""

        # Obtener plantillas del tema
        templates = self.exercise_templates[topic]
        template = random.choice(templates)

        # Generar parámetros según dificultad
        params = self._generate_parameters(topic, difficulty)

        # Crear ejercicio usando la plantilla
        exercise = template(params, difficulty)

        # Agregar metadatos de entrenamiento
        exercise.update({
            'training_metadata': {
                'topic_encoded': self._encode_topic(topic),
                'difficulty_encoded': self._encode_difficulty(difficulty),
                'user_profile_sample': self._generate_user_profile(),
                'tokens': self._text_to_tokens(exercise['problem']),
                'target_tokens': self._text_to_tokens(exercise['answer'])
            },
            'generated_for_training': True,
            'created_at': datetime.now().isoformat()
        })

        return exercise

    def _create_arithmetic_templates(self) -> List:
        """Crea plantillas para ejercicios aritméticos"""

        def suma_template(params, difficulty):
            a, b = params['a'], params['b']
            answer = a + b

            if difficulty == 'basico':
                problem = f"Calcula: {a} + {b}"
                steps = [f"Sumamos {a} + {b} = {answer}"]
            else:
                c = params.get('c', 1)
                answer = (a + b) * c
                problem = f"Calcula: ({a} + {b}) × {c}"
                steps = [
                    f"Primero resolvemos el paréntesis: {a} + {b} = {a + b}",
                    f"Luego multiplicamos: {a + b} × {c} = {answer}"
                ]

            return {
                'id': f'train_arith_{random.randint(1000, 9999)}',
                'topic': 'aritmetica',
                'difficulty': difficulty,
                'problem': problem,
                'answer': str(answer),
                'steps': steps,
                'operation_type': 'suma'
            }

        def resta_template(params, difficulty):
            a, b = params['a'], params['b']
            # Asegurar resultado positivo
            if b > a:
                a, b = b, a
            answer = a - b

            return {
                'id': f'train_arith_{random.randint(1000, 9999)}',
                'topic': 'aritmetica',
                'difficulty': difficulty,
                'problem': f"Calcula: {a} - {b}",
                'answer': str(answer),
                'steps': [f"Restamos {a} - {b} = {answer}"],
                'operation_type': 'resta'
            }

        def multiplicacion_template(params, difficulty):
            a, b = params['a'], params['b']
            # Ajustar números para multiplicación
            if difficulty == 'basico':
                a = min(a, 12)
                b = min(b, 12)

            answer = a * b

            return {
                'id': f'train_arith_{random.randint(1000, 9999)}',
                'topic': 'aritmetica',
                'difficulty': difficulty,
                'problem': f"Calcula: {a} × {b}",
                'answer': str(answer),
                'steps': [f"Multiplicamos {a} × {b} = {answer}"],
                'operation_type': 'multiplicacion'
            }

        return [suma_template, resta_template, multiplicacion_template]

    def _create_algebra_templates(self) -> List:
        """Crea plantillas para ejercicios algebraicos"""

        def ecuacion_lineal_simple(params, difficulty):
            a, b = params['a'], params['b']
            if b <= a:
                b = a + random.randint(1, 10)

            x = b - a

            return {
                'id': f'train_alg_{random.randint(1000, 9999)}',
                'topic': 'algebra',
                'difficulty': difficulty,
                'problem': f"Resuelve para x: x + {a} = {b}",
                'answer': str(x),
                'steps': [
                    f"x + {a} = {b}",
                    f"x = {b} - {a}",
                    f"x = {x}"
                ],
                'equation_type': 'lineal_simple'
            }

        def ecuacion_con_coeficiente(params, difficulty):
            a = params['a'] if params['a'] != 0 else 2
            b, c = params['b'], params['c']

            # Crear ecuación solvible: ax + b = c
            # Donde x = (c - b) / a
            x = 5  # Valor objetivo para x
            c = a * x + b  # Calcular c para que x = 5

            return {
                'id': f'train_alg_{random.randint(1000, 9999)}',
                'topic': 'algebra',
                'difficulty': difficulty,
                'problem': f"Resuelve para x: {a}x + {b} = {c}",
                'answer': str(x),
                'steps': [
                    f"{a}x + {b} = {c}",
                    f"{a}x = {c} - {b}",
                    f"{a}x = {c - b}",
                    f"x = {c - b}/{a}",
                    f"x = {x}"
                ],
                'equation_type': 'lineal_coeficiente'
            }

        def ecuacion_cuadratica_simple(params, difficulty):
            # x² = a donde a es un cuadrado perfecto
            perfect_squares = [4, 9, 16, 25, 36, 49, 64, 81, 100]
            a = random.choice(perfect_squares)
            x = int(math.sqrt(a))

            return {
                'id': f'train_alg_{random.randint(1000, 9999)}',
                'topic': 'algebra',
                'difficulty': difficulty,
                'problem': f"Resuelve para x: x² = {a}",
                'answer': f"±{x}",
                'steps': [
                    f"x² = {a}",
                    f"x = ±√{a}",
                    f"x = ±{x}"
                ],
                'equation_type': 'cuadratica_simple'
            }

        return [ecuacion_lineal_simple, ecuacion_con_coeficiente, ecuacion_cuadratica_simple]

    def _create_geometry_templates(self) -> List:
        """Crea plantillas para ejercicios geométricos"""

        def area_rectangulo(params, difficulty):
            length, width = params['a'], params['b']
            area = length * width

            return {
                'id': f'train_geom_{random.randint(1000, 9999)}',
                'topic': 'geometria',
                'difficulty': difficulty,
                'problem': f"Calcula el área de un rectángulo con largo {length} cm y ancho {width} cm",
                'answer': f"{area} cm²",
                'steps': [
                    "Área del rectángulo = largo × ancho",
                    f"Área = {length} × {width}",
                    f"Área = {area} cm²"
                ],
                'shape_type': 'rectangulo'
            }

        def area_circulo(params, difficulty):
            radius = params['a']
            area = round(3.14 * radius * radius, 2)

            return {
                'id': f'train_geom_{random.randint(1000, 9999)}',
                'topic': 'geometria',
                'difficulty': difficulty,
                'problem': f"Calcula el área de un círculo con radio {radius} cm (usa π = 3.14)",
                'answer': f"{area} cm²",
                'steps': [
                    "Área del círculo = π × r²",
                    f"Área = 3.14 × {radius}²",
                    f"Área = 3.14 × {radius * radius}",
                    f"Área = {area} cm²"
                ],
                'shape_type': 'circulo'
            }

        def perimetro_rectangulo(params, difficulty):
            length, width = params['a'], params['b']
            perimeter = 2 * (length + width)

            return {
                'id': f'train_geom_{random.randint(1000, 9999)}',
                'topic': 'geometria',
                'difficulty': difficulty,
                'problem': f"Calcula el perímetro de un rectángulo de {length} cm × {width} cm",
                'answer': f"{perimeter} cm",
                'steps': [
                    "Perímetro del rectángulo = 2 × (largo + ancho)",
                    f"Perímetro = 2 × ({length} + {width})",
                    f"Perímetro = 2 × {length + width}",
                    f"Perímetro = {perimeter} cm"
                ],
                'shape_type': 'rectangulo'
            }

        return [area_rectangulo, area_circulo, perimetro_rectangulo]

    def _create_fraction_templates(self) -> List:
        """Crea plantillas para ejercicios de fracciones"""

        def suma_mismo_denominador(params, difficulty):
            denominator = params['c']
            num1 = params['a'] % denominator if params['a'] < denominator else params['a'] // 2
            num2 = params['b'] % denominator if params['b'] < denominator else params['b'] // 2

            if num1 == 0:
                num1 = 1
            if num2 == 0:
                num2 = 1

            result_num = num1 + num2

            return {
                'id': f'train_frac_{random.randint(1000, 9999)}',
                'topic': 'fracciones',
                'difficulty': difficulty,
                'problem': f"Calcula: {num1}/{denominator} + {num2}/{denominator}",
                'answer': f"{result_num}/{denominator}",
                'steps': [
                    "Como tienen el mismo denominador, sumamos los numeradores:",
                    f"{num1} + {num2} = {result_num}",
                    f"Resultado: {result_num}/{denominator}"
                ],
                'fraction_type': 'suma_mismo_denominador'
            }

        def multiplicacion_fracciones(params, difficulty):
            num1, den1 = params['a'], params['b']
            num2, den2 = params['c'], params.get('d', params['a'] + 1)

            result_num = num1 * num2
            result_den = den1 * den2

            return {
                'id': f'train_frac_{random.randint(1000, 9999)}',
                'topic': 'fracciones',
                'difficulty': difficulty,
                'problem': f"Calcula: {num1}/{den1} × {num2}/{den2}",
                'answer': f"{result_num}/{result_den}",
                'steps': [
                    "Multiplicamos numerador × numerador y denominador × denominador:",
                    f"({num1} × {num2}) / ({den1} × {den2})",
                    f"{result_num}/{result_den}"
                ],
                'fraction_type': 'multiplicacion'
            }

        return [suma_mismo_denominador, multiplicacion_fracciones]

    def _generate_parameters(self, topic: str, difficulty: str) -> Dict:
        """Genera parámetros numéricos según el tema y dificultad"""

        ranges = self.difficulty_ranges[difficulty]
        min_val, max_val = ranges['min'], ranges['max']

        if topic == 'aritmetica':
            if difficulty == 'basico':
                return {
                    'a': random.randint(1, 50),
                    'b': random.randint(1, 50),
                    'c': random.randint(2, 8)
                }
            else:
                return {
                    'a': random.randint(min_val, max_val // 10),
                    'b': random.randint(min_val, max_val // 10),
                    'c': random.randint(2, 15)
                }

        elif topic == 'algebra':
            return {
                'a': random.randint(1, 10),
                'b': random.randint(1, min_val),
                'c': random.randint(min_val, max_val)
            }

        elif topic == 'geometria':
            return {
                'a': random.randint(2, max_val // 10),
                'b': random.randint(2, max_val // 10)
            }

        elif topic == 'fracciones':
            return {
                'a': random.randint(1, 8),
                'b': random.randint(2, 12),
                'c': random.randint(2, 10),
                'd': random.randint(2, 8)
            }

        return {'a': 1, 'b': 1, 'c': 1}

    def _encode_topic(self, topic: str) -> int:
        """Codifica tema a número"""
        mapping = {'aritmetica': 0, 'algebra': 1, 'geometria': 2, 'fracciones': 3}
        return mapping.get(topic, 0)

    def _encode_difficulty(self, difficulty: str) -> int:
        """Codifica dificultad a número"""
        mapping = {'basico': 0, 'intermedio': 1, 'avanzado': 2}
        return mapping.get(difficulty, 0)

    def _generate_user_profile(self) -> Dict:
        """Genera perfil de usuario sintético para entrenamiento"""
        return {
            'edad': random.randint(8, 16),
            'rendimiento': random.uniform(0.3, 0.9),
            'preferencia_visual': random.uniform(0.0, 1.0)
        }

    def _text_to_tokens(self, text: str) -> List[int]:
        """Convierte texto a tokens (simplificado para entrenamiento)"""
        # Tokenización básica para entrenamiento
        tokens = []
        words = text.lower().split()

        for word in words:
            # Extraer números
            if word.isdigit():
                tokens.append(int(word) if int(word) < 100 else 99)
            # Operadores
            elif '+' in word:
                tokens.append(100)
            elif '-' in word:
                tokens.append(101)
            elif '×' in word or '*' in word:
                tokens.append(102)
            elif '/' in word:
                tokens.append(103)
            elif '=' in word:
                tokens.append(104)
            # Palabras clave
            elif 'calcula' in word:
                tokens.append(108)
            elif 'resuelve' in word:
                tokens.append(109)
            else:
                tokens.append(110)  # Palabra genérica

        return tokens[:20]  # Limitar longitud

    def save_dataset(self, dataset: List[Dict], filename: str = None) -> str:
        """Guarda el dataset de entrenamiento"""

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"training_dataset_{timestamp}.json"

        # Estadísticas del dataset
        stats = self._calculate_dataset_stats(dataset)

        # Estructura final del archivo
        final_data = {
            'metadata': {
                'total_exercises': len(dataset),
                'created_at': datetime.now().isoformat(),
                'stats': stats,
                'version': '1.0'
            },
            'exercises': dataset
        }

        # Guardar
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Dataset guardado en: {filename}")
        print(f"📊 Total de ejercicios: {len(dataset)}")
        print(f"📈 Estadísticas:")
        for topic, count in stats['by_topic'].items():
            print(f"   {topic}: {count} ejercicios")

        return filename

    def _calculate_dataset_stats(self, dataset: List[Dict]) -> Dict:
        """Calcula estadísticas del dataset"""

        stats = {
            'by_topic': {},
            'by_difficulty': {},
            'by_topic_difficulty': {}
        }

        for exercise in dataset:
            topic = exercise['topic']
            difficulty = exercise['difficulty']

            # Por tema
            stats['by_topic'][topic] = stats['by_topic'].get(topic, 0) + 1

            # Por dificultad
            stats['by_difficulty'][difficulty] = stats['by_difficulty'].get(difficulty, 0) + 1

            # Por tema y dificultad
            key = f"{topic}_{difficulty}"
            stats['by_topic_difficulty'][key] = stats['by_topic_difficulty'].get(key, 0) + 1

        return stats

    def load_dataset(self, filename: str) -> Tuple[List[Dict], Dict]:
        """Carga un dataset previamente guardado"""

        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)

            exercises = data.get('exercises', [])
            metadata = data.get('metadata', {})

            print(f"📂 Dataset cargado: {len(exercises)} ejercicios")
            return exercises, metadata

        except Exception as e:
            print(f"❌ Error cargando dataset: {e}")
            return [], {}


def main():
    """Función principal para generar dataset de entrenamiento"""

    print("🎓 GENERADOR DE DATOS DE ENTRENAMIENTO")
    print("=" * 50)

    # Crear generador
    generator = TrainingDataGenerator()

    # Generar dataset
    print("¿Cuántos ejercicios por tema y dificultad quieres generar?")
    print("(Recomendado: 100 para prueba, 500 para entrenamiento real)")

    try:
        samples = int(input("Número de ejercicios: ") or "100")
    except ValueError:
        samples = 100
        print(f"Usando valor por defecto: {samples}")

    # Generar dataset
    dataset = generator.generate_training_dataset(samples)

    # Guardar dataset
    filename = generator.save_dataset(dataset)

    # Mostrar ejemplos
    print(f"\n📝 EJEMPLOS DEL DATASET GENERADO:")
    print("-" * 40)

    for i, exercise in enumerate(dataset[:5]):  # Mostrar primeros 5
        print(f"\nEjercicio {i + 1}:")
        print(f"  Tema: {exercise['topic']} - {exercise['difficulty']}")
        print(f"  Problema: {exercise['problem']}")
        print(f"  Respuesta: {exercise['answer']}")

    print(f"\n✅ Dataset listo para entrenar el modelo!")
    print(f"📁 Archivo: {filename}")

    return filename


if __name__ == "__main__":
    main()