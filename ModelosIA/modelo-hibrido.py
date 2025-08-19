"""
MODELO HÍBRIDO: RED NEURONAL + SISTEMA EXPERTO
Para generación de ejercicios matemáticos en MATH_M1M

Componentes:
1. Red Neuronal Generativa (aprendizaje y creatividad)
2. Sistema Experto Validador (precisión matemática)
"""
#Este Modelo realmente, de momento solo genera ejercicios artmeticos sencillos es solo una prueba.
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model
import json
import random
import re
from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional
import pickle


class NeuralExerciseGenerator:
    """
    Red Neuronal para generar ejercicios matemáticos
    """

    def __init__(self, vocab_size=1000, embedding_dim=64):
        self.vocab_size = vocab_size
        self.embedding_dim = embedding_dim
        self.model = None
        self.tokenizer = self._create_tokenizer()
        self.is_trained = False

    def _create_tokenizer(self):
        """Crea el tokenizador matemático"""
        # Vocabulario matemático básico
        math_vocab = {
            # Números
            **{str(i): i for i in range(100)},
            # Operadores
            '+': 100, '-': 101, '*': 102, '/': 103, '=': 104,
            # Variables
            'x': 105, 'y': 106, 'z': 107,
            # Palabras clave
            'calcula': 108, 'resuelve': 109, 'encuentra': 110,
            'suma': 111, 'resta': 112, 'multiplica': 113,
            'área': 114, 'perímetro': 115, 'volumen': 116,
            # Símbolos especiales
            '(': 117, ')': 118, '²': 119, '√': 120,
            # Padding y tokens especiales
            '<PAD>': 0, '<START>': 1, '<END>': 2, '<UNK>': 3
        }
        return math_vocab

    def build_model(self):
        """Construye la arquitectura de la red neuronal"""

        # Entradas
        tema_input = layers.Input(shape=(1,), name='tema')
        dificultad_input = layers.Input(shape=(1,), name='dificultad')
        usuario_input = layers.Input(shape=(3,), name='usuario')  # edad, rendimiento, preferencias

        # Embeddings
        tema_embed = layers.Embedding(4, 32, name='tema_embedding')(tema_input)
        dificultad_embed = layers.Embedding(3, 16, name='dificultad_embedding')(dificultad_input)

        # Aplanar embeddings
        tema_flat = layers.Flatten()(tema_embed)
        dificultad_flat = layers.Flatten()(dificultad_embed)

        # Concatenar todas las entradas
        combined = layers.Concatenate()([tema_flat, dificultad_flat, usuario_input])

        # Capas densas de la red neuronal
        hidden1 = layers.Dense(128, activation='relu', name='hidden1')(combined)
        hidden1 = layers.Dropout(0.3)(hidden1)

        hidden2 = layers.Dense(256, activation='relu', name='hidden2')(hidden1)
        hidden2 = layers.Dropout(0.3)(hidden2)

        hidden3 = layers.Dense(128, activation='relu', name='hidden3')(hidden2)
        hidden3 = layers.Dropout(0.3)(hidden3)

        # Capa de salida para generar tokens
        output = layers.Dense(self.vocab_size, activation='softmax', name='output')(hidden3)

        # Crear modelo
        self.model = Model(
            inputs=[tema_input, dificultad_input, usuario_input],
            outputs=output,
            name='NeuralExerciseGenerator'
        )

        # Compilar
        self.model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )

        return self.model

    def encode_input(self, tema, dificultad, usuario_perfil):
        """Codifica las entradas para la red neuronal"""

        # Mapear tema a número
        tema_map = {'aritmetica': 0, 'algebra': 1, 'geometria': 2, 'fracciones': 3}
        tema_encoded = tema_map.get(tema, 0)

        # Mapear dificultad a número
        dificultad_map = {'basico': 0, 'intermedio': 1, 'avanzado': 2}
        dificultad_encoded = dificultad_map.get(dificultad, 0)

        # Perfil de usuario normalizado
        edad_norm = (usuario_perfil.get('edad', 12) - 6) / 12  # Normalizar entre 0-1
        rendimiento_norm = usuario_perfil.get('rendimiento', 0.5)  # Ya entre 0-1
        preferencia_norm = usuario_perfil.get('preferencia_visual', 0.5)  # Entre 0-1

        return {
            'tema': np.array([[tema_encoded]]),
            'dificultad': np.array([[dificultad_encoded]]),
            'usuario': np.array([[edad_norm, rendimiento_norm, preferencia_norm]])
        }

    def generate_exercise_tokens(self, tema, dificultad, usuario_perfil, max_tokens=50):
        """Genera tokens de ejercicio usando la red neuronal"""

        if not self.is_trained:
            # Si no está entrenada, usar generación básica
            return self._generate_basic_tokens(tema, dificultad)

        inputs = self.encode_input(tema, dificultad, usuario_perfil)

        generated_tokens = []
        for _ in range(max_tokens):
            # Predecir siguiente token
            predictions = self.model.predict(inputs, verbose=0)

            # Muestreo con temperatura para variedad
            token_id = self._sample_with_temperature(predictions[0], temperature=0.7)

            if token_id == 2:  # <END> token
                break

            generated_tokens.append(token_id)

        return generated_tokens

    def _sample_with_temperature(self, predictions, temperature=1.0):
        """Muestreo con temperatura para controlar aleatoriedad"""
        predictions = np.asarray(predictions).astype('float64')
        predictions = np.log(predictions + 1e-8) / temperature
        exp_preds = np.exp(predictions)
        predictions = exp_preds / np.sum(exp_preds)
        probas = np.random.multinomial(1, predictions, 1)
        return np.argmax(probas)

    def _generate_basic_tokens(self, tema, dificultad):
        """Generación básica cuando el modelo no está entrenado"""
        # Plantillas simples para arrancar
        if tema == 'aritmetica':
            a, b = random.randint(1, 20), random.randint(1, 20)
            return [108, a, 100, b]  # "calcula {a} + {b}"
        elif tema == 'algebra':
            a, b = random.randint(1, 10), random.randint(11, 50)
            return [109, 105, 100, a, 104, b]  # "resuelve x + {a} = {b}"
        else:
            return [108, 5, 100, 3]  # fallback básico

    def tokens_to_text(self, tokens):
        """Convierte tokens a texto legible"""
        reverse_vocab = {v: k for k, v in self.tokenizer.items()}
        text_parts = []

        for token in tokens:
            if token in reverse_vocab:
                text_parts.append(reverse_vocab[token])
            else:
                text_parts.append('<UNK>')

        return ' '.join(text_parts)

    def train_with_data(self, training_data, epochs=50, batch_size=32):
        """Entrena la red neuronal con datos de ejercicios"""
        print("🧠 Entrenando Red Neuronal...")

        if self.model is None:
            self.build_model()

        # Preparar datos de entrenamiento
        X_tema, X_dificultad, X_usuario, y = self._prepare_training_data(training_data)

        # Entrenar
        history = self.model.fit(
            [X_tema, X_dificultad, X_usuario], y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )

        self.is_trained = True
        print("✅ Red Neuronal entrenada!")
        return history

    def _prepare_training_data(self, training_data):
        """Prepara los datos para el entrenamiento"""
        # Este método prepararía los datos reales de entrenamiento
        # Por ahora, datos sintéticos para demostración

        n_samples = len(training_data)
        X_tema = np.random.randint(0, 4, (n_samples, 1))
        X_dificultad = np.random.randint(0, 3, (n_samples, 1))
        X_usuario = np.random.rand(n_samples, 3)
        y = np.random.rand(n_samples, self.vocab_size)

        return X_tema, X_dificultad, X_usuario, y


class ExpertValidationSystem:
    """
    Sistema Experto para validar ejercicios matemáticos
    """

    def __init__(self):
        self.rules = self._initialize_rules()
        self.validation_count = 0
        self.success_rate = 0.0

    def _initialize_rules(self):
        """Inicializa la base de conocimiento del sistema experto"""
        return {
            'aritmetica': ArithmeticRules(),
            'algebra': AlgebraRules(),
            'geometria': GeometryRules(),
            'fracciones': FractionRules()
        }

    def validate_exercise(self, exercise_data: Dict) -> Tuple[bool, float, List[str]]:
        """
        Valida un ejercicio usando las reglas expertas

        Returns:
            (es_válido, confianza, errores_encontrados)
        """
        self.validation_count += 1

        topic = exercise_data.get('topic', 'aritmetica')
        problem = exercise_data.get('problem', '')
        answer = exercise_data.get('answer', '')
        steps = exercise_data.get('steps', [])

        # Obtener validador específico para el tema
        validator = self.rules.get(topic)
        if not validator:
            return False, 0.0, ['Tema no soportado']

        # Ejecutar validación
        is_valid, confidence, errors = validator.validate(problem, answer, steps)

        # Actualizar estadísticas
        if is_valid:
            self.success_rate = (self.success_rate * (self.validation_count - 1) + 1.0) / self.validation_count
        else:
            self.success_rate = (self.success_rate * (self.validation_count - 1)) / self.validation_count

        return is_valid, confidence, errors

    def get_validation_stats(self):
        """Obtiene estadísticas del sistema de validación"""
        return {
            'total_validations': self.validation_count,
            'success_rate': self.success_rate,
            'available_topics': list(self.rules.keys())
        }


class ArithmeticRules:
    """Reglas de validación para aritmética"""

    def validate(self, problem: str, answer: str, steps: List[str]) -> Tuple[bool, float, List[str]]:
        errors = []
        confidence = 1.0

        # Extraer operación del problema
        operation_match = re.search(r'(\d+)\s*([+\-*/])\s*(\d+)', problem)
        if not operation_match:
            return False, 0.0, ['No se pudo identificar la operación']

        num1, operator, num2 = operation_match.groups()
        num1, num2 = int(num1), int(num2)

        # Calcular respuesta esperada
        expected_answer = self._calculate_result(num1, operator, num2)

        # Validar respuesta
        try:
            given_answer = int(answer)
            if given_answer != expected_answer:
                errors.append(f'Respuesta incorrecta: esperado {expected_answer}, obtenido {given_answer}')
                confidence = 0.0
        except ValueError:
            errors.append('Respuesta no es un número válido')
            confidence = 0.0

        return len(errors) == 0, confidence, errors

    def _calculate_result(self, num1, operator, num2):
        """Calcula el resultado de una operación aritmética"""
        if operator == '+':
            return num1 + num2
        elif operator == '-':
            return num1 - num2
        elif operator == '*':
            return num1 * num2
        elif operator == '/':
            return num1 / num2 if num2 != 0 else None
        return None


class AlgebraRules:
    """Reglas de validación para álgebra"""

    def validate(self, problem: str, answer: str, steps: List[str]) -> Tuple[bool, float, List[str]]:
        errors = []
        confidence = 1.0

        # Buscar ecuación simple: ax + b = c
        equation_match = re.search(r'(\d*)x\s*([+\-])\s*(\d+)\s*=\s*(\d+)', problem)
        if equation_match:
            return self._validate_linear_equation(equation_match, answer, errors)

        # Buscar ecuación cuadrática: x² = a
        square_match = re.search(r'x²\s*=\s*(\d+)', problem)
        if square_match:
            return self._validate_square_equation(square_match, answer, errors)

        errors.append('Tipo de ecuación no reconocido')
        return False, 0.0, errors

    def _validate_linear_equation(self, match, answer, errors):
        """Valida ecuación lineal ax + b = c"""
        a_str, operator, b_str, c_str = match.groups()

        a = int(a_str) if a_str else 1
        b = int(b_str)
        c = int(c_str)

        if operator == '-':
            b = -b

        # Resolver: x = (c - b) / a
        if a == 0:
            errors.append('Coeficiente de x no puede ser cero')
            return False, 0.0, errors

        expected_x = (c - b) / a

        try:
            given_x = float(answer)
            if abs(given_x - expected_x) > 0.01:  # Tolerancia para decimales
                errors.append(f'Respuesta incorrecta: esperado {expected_x}, obtenido {given_x}')
                return False, 0.0, errors
        except ValueError:
            errors.append('Respuesta no es un número válido')
            return False, 0.0, errors

        return True, 1.0, errors

    def _validate_square_equation(self, match, answer, errors):
        """Valida ecuación cuadrática x² = a"""
        a = int(match.group(1))

        if a < 0:
            errors.append('No hay solución real para x² = número negativo')
            return False, 0.0, errors

        expected_x = a ** 0.5

        # Aceptar tanto ±x como solo el valor positivo
        if f'±{expected_x}' in answer or f'±{int(expected_x)}' in answer:
            return True, 1.0, errors

        try:
            given_x = abs(float(answer))
            if abs(given_x - expected_x) > 0.01:
                errors.append(f'Respuesta incorrecta: esperado ±{expected_x}')
                return False, 0.0, errors
        except ValueError:
            errors.append('Respuesta no es un número válido')
            return False, 0.0, errors

        return True, 1.0, errors


class GeometryRules:
    """Reglas de validación para geometría"""

    def validate(self, problem: str, answer: str, steps: List[str]) -> Tuple[bool, float, List[str]]:
        errors = []

        # Área de rectángulo
        rect_match = re.search(r'rectángulo.*?(\d+).*?(\d+)', problem)
        if rect_match and 'área' in problem.lower():
            return self._validate_rectangle_area(rect_match, answer, errors)

        # Área de círculo
        circle_match = re.search(r'círculo.*?radio\s*(\d+)', problem)
        if circle_match and 'área' in problem.lower():
            return self._validate_circle_area(circle_match, answer, errors)

        errors.append('Tipo de problema geométrico no reconocido')
        return False, 0.0, errors

    def _validate_rectangle_area(self, match, answer, errors):
        """Valida área de rectángulo"""
        length, width = int(match.group(1)), int(match.group(2))
        expected_area = length * width

        # Extraer número de la respuesta (puede incluir "cm²")
        answer_match = re.search(r'(\d+)', answer)
        if not answer_match:
            errors.append('No se encontró valor numérico en la respuesta')
            return False, 0.0, errors

        given_area = int(answer_match.group(1))
        if given_area != expected_area:
            errors.append(f'Área incorrecta: esperado {expected_area}, obtenido {given_area}')
            return False, 0.0, errors

        return True, 1.0, errors

    def _validate_circle_area(self, match, answer, errors):
        """Valida área de círculo"""
        radius = int(match.group(1))
        expected_area = 3.14 * radius * radius

        answer_match = re.search(r'(\d+\.?\d*)', answer)
        if not answer_match:
            errors.append('No se encontró valor numérico en la respuesta')
            return False, 0.0, errors

        given_area = float(answer_match.group(1))
        if abs(given_area - expected_area) > 0.1:
            errors.append(f'Área incorrecta: esperado {expected_area:.2f}, obtenido {given_area}')
            return False, 0.0, errors

        return True, 1.0, errors


class FractionRules:
    """Reglas de validación para fracciones"""

    def validate(self, problem: str, answer: str, steps: List[str]) -> Tuple[bool, float, List[str]]:
        errors = []

        # Suma de fracciones con mismo denominador
        same_denom_match = re.search(r'(\d+)/(\d+)\s*\+\s*(\d+)/(\d+)', problem)
        if same_denom_match:
            return self._validate_fraction_addition(same_denom_match, answer, errors)

        errors.append('Tipo de operación con fracciones no reconocido')
        return False, 0.0, errors

    def _validate_fraction_addition(self, match, answer, errors):
        """Valida suma de fracciones"""
        num1, den1, num2, den2 = [int(x) for x in match.groups()]

        if den1 == den2:
            # Mismo denominador
            expected_num = num1 + num2
            expected_den = den1
        else:
            # Diferente denominador (simplificado)
            errors.append('Suma de fracciones con diferente denominador no implementada')
            return False, 0.0, errors

        expected_answer = f'{expected_num}/{expected_den}'

        if answer.strip() != expected_answer:
            errors.append(f'Respuesta incorrecta: esperado {expected_answer}, obtenido {answer}')
            return False, 0.0, errors

        return True, 1.0, errors


class HybridMathModel:
    """
    Modelo híbrido que combina Red Neuronal + Sistema Experto
    """

    def __init__(self):
        self.neural_generator = NeuralExerciseGenerator()
        self.expert_validator = ExpertValidationSystem()
        self.generation_stats = {
            'total_generated': 0,
            'successful_validations': 0,
            'average_attempts': 0.0
        }

    def generate_validated_exercise(self, tema: str, dificultad: str, usuario_perfil: Dict,
                                    max_attempts: int = 5) -> Dict:
        """
        Genera un ejercicio usando la red neuronal y lo valida con el sistema experto
        """

        for attempt in range(max_attempts):
            # Paso 1: Generar con red neuronal
            exercise_candidate = self._neural_generation(tema, dificultad, usuario_perfil)

            # Paso 2: Validar con sistema experto
            is_valid, confidence, errors = self.expert_validator.validate_exercise(exercise_candidate)

            if is_valid:
                # Éxito: ejercicio válido generado
                self._update_stats(attempt + 1, True)

                return {
                    **exercise_candidate,
                    'validation': {
                        'is_valid': True,
                        'confidence': confidence,
                        'attempts_needed': attempt + 1,
                        'errors': []
                    },
                    'generated_at': datetime.now().isoformat(),
                    'model_type': 'hybrid_neural_expert'
                }
            else:
                # Retroalimentación para el siguiente intento
                if attempt < max_attempts - 1:
                    self._provide_feedback_to_neural(exercise_candidate, errors)

        # Si no se logra generar válido, usar fallback determinístico
        self._update_stats(max_attempts, False)
        return self._generate_fallback_exercise(tema, dificultad, usuario_perfil)

    def _neural_generation(self, tema: str, dificultad: str, usuario_perfil: Dict) -> Dict:
        """Genera ejercicio usando la red neuronal"""

        # Generar tokens con la red neuronal
        tokens = self.neural_generator.generate_exercise_tokens(tema, dificultad, usuario_perfil)

        # Convertir tokens a texto
        problem_text = self.neural_generator.tokens_to_text(tokens)

        # Procesar y estructurar el ejercicio
        exercise = self._process_neural_output(problem_text, tema, dificultad)

        return exercise

    def _process_neural_output(self, raw_text: str, tema: str, dificultad: str) -> Dict:
        """Procesa la salida cruda de la red neuronal en un ejercicio estructurado"""

        # Parsear el texto generado por la red neuronal
        if tema == 'aritmetica':
            return self._parse_arithmetic_problem(raw_text, dificultad)
        elif tema == 'algebra':
            return self._parse_algebra_problem(raw_text, dificultad)
        elif tema == 'geometria':
            return self._parse_geometry_problem(raw_text, dificultad)
        elif tema == 'fracciones':
            return self._parse_fraction_problem(raw_text, dificultad)
        else:
            return self._create_default_exercise(tema, dificultad)

    def _parse_arithmetic_problem(self, text: str, dificultad: str) -> Dict:
        """Parsea problema aritmético del texto de la red neuronal"""

        # Extraer números y operador del texto generado
        numbers = re.findall(r'\d+', text)
        operators = re.findall(r'[+\-*/]', text)

        if len(numbers) >= 2 and operators:
            a, b = int(numbers[0]), int(numbers[1])
            op = operators[0]

            # Calcular respuesta
            if op == '+':
                answer = a + b
                operation_text = f"{a} + {b}"
            elif op == '-':
                answer = a - b if a > b else b - a  # Evitar negativos en básico
                operation_text = f"{max(a, b)} - {min(a, b)}"
            elif op == '*':
                answer = a * b
                operation_text = f"{a} × {b}"
            else:
                answer = a + b  # Fallback a suma
                operation_text = f"{a} + {b}"

            return {
                'id': f'arith_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'aritmetica',
                'difficulty': dificultad,
                'problem': f"Calcula: {operation_text}",
                'answer': str(answer),
                'steps': [
                    f"Realizamos la operación: {operation_text}",
                    f"Resultado: {answer}"
                ],
                'hints': [f"Recuerda las reglas de la {self._get_operation_name(op)}"]
            }

        return self._create_default_exercise('aritmetica', dificultad)

    def _parse_algebra_problem(self, text: str, dificultad: str) -> Dict:
        """Parsea problema algebraico del texto de la red neuronal"""

        numbers = re.findall(r'\d+', text)

        if len(numbers) >= 2:
            a, b = int(numbers[0]), int(numbers[1])

            if dificultad == 'basico':
                # x + a = b
                x = b - a if b > a else a + b
                problem = f"Resuelve para x: x + {min(a, b)} = {max(a, b)}"
                steps = [
                    f"x + {min(a, b)} = {max(a, b)}",
                    f"x = {max(a, b)} - {min(a, b)}",
                    f"x = {x}"
                ]
            else:
                # ax + b = c
                c = a * 5 + b  # Crear una ecuación solvible
                x = 5
                problem = f"Resuelve para x: {a}x + {b} = {c}"
                steps = [
                    f"{a}x + {b} = {c}",
                    f"{a}x = {c} - {b}",
                    f"{a}x = {c - b}",
                    f"x = {(c - b) // a if a != 0 else 1}"
                ]

            return {
                'id': f'alg_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'algebra',
                'difficulty': dificultad,
                'problem': problem,
                'answer': str(x),
                'steps': steps,
                'hints': ["Despeja x pasando términos al otro lado"]
            }

        return self._create_default_exercise('algebra', dificultad)

    def _parse_geometry_problem(self, text: str, dificultad: str) -> Dict:
        """Parsea problema geométrico del texto de la red neuronal"""

        numbers = re.findall(r'\d+', text)

        if len(numbers) >= 2:
            length, width = int(numbers[0]), int(numbers[1])
            area = length * width

            return {
                'id': f'geom_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'geometria',
                'difficulty': dificultad,
                'problem': f"Calcula el área de un rectángulo con largo {length} cm y ancho {width} cm",
                'answer': f"{area} cm²",
                'steps': [
                    "Área del rectángulo = largo × ancho",
                    f"Área = {length} × {width}",
                    f"Área = {area} cm²"
                ],
                'hints': ["La fórmula del área del rectángulo es: largo × ancho"]
            }

        return self._create_default_exercise('geometria', dificultad)

    def _parse_fraction_problem(self, text: str, dificultad: str) -> Dict:
        """Parsea problema de fracciones del texto de la red neuronal"""

        numbers = re.findall(r'\d+', text)

        if len(numbers) >= 3:
            num1, num2, denominator = int(numbers[0]), int(numbers[1]), int(numbers[2])

            # Asegurar que los numeradores sean menores que el denominador
            num1 = num1 % denominator if num1 >= denominator else num1
            num2 = num2 % denominator if num2 >= denominator else num2

            if num1 == 0:
                num1 = 1
            if num2 == 0:
                num2 = 1

            result_num = num1 + num2

            return {
                'id': f'frac_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'fracciones',
                'difficulty': dificultad,
                'problem': f"Calcula: {num1}/{denominator} + {num2}/{denominator}",
                'answer': f"{result_num}/{denominator}",
                'steps': [
                    "Como tienen el mismo denominador, sumamos los numeradores:",
                    f"{num1} + {num2} = {result_num}",
                    f"Resultado: {result_num}/{denominator}"
                ],
                'hints': ["Con mismo denominador, solo suma los numeradores"]
            }

        return self._create_default_exercise('fracciones', dificultad)

    def _get_operation_name(self, operator: str) -> str:
        """Obtiene el nombre de la operación"""
        names = {'+': 'suma', '-': 'resta', '*': 'multiplicación', '/': 'división'}
        return names.get(operator, 'operación')

    def _provide_feedback_to_neural(self, failed_exercise: Dict, errors: List[str]):
        """Proporciona retroalimentación a la red neuronal para mejorar"""

        # En una implementación real, esto ajustaría los pesos de la red
        # Por ahora, registramos el error para análisis futuro
        feedback = {
            'failed_exercise': failed_exercise,
            'errors': errors,
            'timestamp': datetime.now().isoformat()
        }

        # Guardar feedback para reentrenamiento futuro
        self._save_feedback(feedback)

    def _save_feedback(self, feedback: Dict):
        """Guarda feedback para futuro reentrenamiento"""
        try:
            with open('feedback_log.json', 'a', encoding='utf-8') as f:
                json.dump(feedback, f, ensure_ascii=False)
                f.write('\n')
        except Exception as e:
            print(f"No se pudo guardar feedback: {e}")

    def _generate_fallback_exercise(self, tema: str, dificultad: str, usuario_perfil: Dict) -> Dict:
        """Genera ejercicio de respaldo cuando falla la validación"""

        fallback_generators = {
            'aritmetica': self._fallback_arithmetic,
            'algebra': self._fallback_algebra,
            'geometria': self._fallback_geometry,
            'fracciones': self._fallback_fractions
        }

        generator = fallback_generators.get(tema, self._fallback_arithmetic)
        exercise = generator(dificultad)

        exercise['validation'] = {
            'is_valid': True,
            'confidence': 0.8,  # Menor confianza por ser fallback
            'attempts_needed': 'fallback',
            'errors': []
        }

        return exercise

    def _fallback_arithmetic(self, dificultad: str) -> Dict:
        """Generador de respaldo para aritmética"""
        if dificultad == 'basico':
            a, b = random.randint(1, 20), random.randint(1, 20)
            answer = a + b
            return {
                'id': f'fallback_arith_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'aritmetica',
                'difficulty': dificultad,
                'problem': f"Calcula: {a} + {b}",
                'answer': str(answer),
                'steps': [f"Sumamos {a} + {b} = {answer}"],
                'hints': ["Cuenta hacia adelante desde el primer número"]
            }
        else:
            a, b, c = random.randint(5, 20), random.randint(5, 20), random.randint(2, 8)
            intermediate = a + b
            answer = intermediate * c
            return {
                'id': f'fallback_arith_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
                'topic': 'aritmetica',
                'difficulty': dificultad,
                'problem': f"Calcula: ({a} + {b}) × {c}",
                'answer': str(answer),
                'steps': [
                    f"Primero: {a} + {b} = {intermediate}",
                    f"Luego: {intermediate} × {c} = {answer}"
                ],
                'hints': ["Resuelve los paréntesis primero"]
            }

    def _fallback_algebra(self, dificultad: str) -> Dict:
        """Generador de respaldo para álgebra"""
        a, b = random.randint(1, 15), random.randint(16, 50)
        x = b - a
        return {
            'id': f'fallback_alg_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
            'topic': 'algebra',
            'difficulty': dificultad,
            'problem': f"Resuelve para x: x + {a} = {b}",
            'answer': str(x),
            'steps': [
                f"x + {a} = {b}",
                f"x = {b} - {a}",
                f"x = {x}"
            ],
            'hints': ["Pasa el número sumando al otro lado restando"]
        }

    def _fallback_geometry(self, dificultad: str) -> Dict:
        """Generador de respaldo para geometría"""
        length, width = random.randint(3, 12), random.randint(2, 10)
        area = length * width
        return {
            'id': f'fallback_geom_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
            'topic': 'geometria',
            'difficulty': dificultad,
            'problem': f"Calcula el área de un rectángulo de {length} cm × {width} cm",
            'answer': f"{area} cm²",
            'steps': [
                f"Área = largo × ancho",
                f"Área = {length} × {width} = {area} cm²"
            ],
            'hints': ["Multiplica largo por ancho"]
        }

    def _fallback_fractions(self, dificultad: str) -> Dict:
        """Generador de respaldo para fracciones"""
        denominator = random.choice([4, 6, 8])
        num1 = random.randint(1, denominator - 2)
        num2 = random.randint(1, denominator - num1)
        result = num1 + num2

        return {
            'id': f'fallback_frac_{datetime.now().strftime("%Y%m%d_%H%M%S_%f")}',
            'topic': 'fracciones',
            'difficulty': dificultad,
            'problem': f"Calcula: {num1}/{denominator} + {num2}/{denominator}",
            'answer': f"{result}/{denominator}",
            'steps': [
                f"Sumamos numeradores: {num1} + {num2} = {result}",
                f"Resultado: {result}/{denominator}"
            ],
            'hints': ["Mismo denominador = suma solo numeradores"]
        }

    def _create_default_exercise(self, tema: str, dificultad: str) -> Dict:
        """Crea ejercicio por defecto cuando falla el parsing"""
        return self._generate_fallback_exercise(tema, dificultad, {})

    def _update_stats(self, attempts: int, success: bool):
        """Actualiza estadísticas del modelo"""
        self.generation_stats['total_generated'] += 1

        if success:
            self.generation_stats['successful_validations'] += 1

        # Actualizar promedio de intentos
        total = self.generation_stats['total_generated']
        current_avg = self.generation_stats['average_attempts']
        self.generation_stats['average_attempts'] = (current_avg * (total - 1) + attempts) / total

    def train_neural_component(self, training_data: List[Dict], epochs: int = 50):
        """Entrena el componente de red neuronal"""
        print("🎓 Iniciando entrenamiento del componente neural...")

        # Construir modelo si no existe
        if self.neural_generator.model is None:
            self.neural_generator.build_model()

        # Entrenar
        history = self.neural_generator.train_with_data(training_data, epochs)

        print("✅ Entrenamiento completado!")
        return history

    def save_model(self, filepath: str):
        """Guarda el modelo entrenado"""
        model_data = {
            'neural_weights': None,  # Se guardarían los pesos de la red neuronal
            'expert_rules': self.expert_validator.rules,
            'stats': self.generation_stats,
            'version': '1.0',
            'saved_at': datetime.now().isoformat()
        }

        # Guardar pesos de la red neuronal si existe
        if self.neural_generator.model is not None:
            neural_filepath = filepath.replace('.json', '_neural.h5')
            self.neural_generator.model.save_weights(neural_filepath)
            model_data['neural_weights'] = neural_filepath

        # Guardar metadatos
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(model_data, f, indent=2, ensure_ascii=False, default=str)

        print(f"💾 Modelo guardado en: {filepath}")

    def load_model(self, filepath: str):
        """Carga un modelo previamente entrenado"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                model_data = json.load(f)

            # Cargar estadísticas
            self.generation_stats = model_data.get('stats', self.generation_stats)

            # Cargar pesos de red neuronal si existen
            neural_weights_path = model_data.get('neural_weights')
            if neural_weights_path and self.neural_generator.model is not None:
                self.neural_generator.model.load_weights(neural_weights_path)
                self.neural_generator.is_trained = True

            print(f"📂 Modelo cargado desde: {filepath}")
            return True

        except Exception as e:
            print(f"❌ Error cargando modelo: {e}")
            return False

    def get_model_stats(self) -> Dict:
        """Obtiene estadísticas del modelo híbrido"""
        return {
            'generation_stats': self.generation_stats,
            'validation_stats': self.expert_validator.get_validation_stats(),
            'neural_status': {
                'is_trained': self.neural_generator.is_trained,
                'vocab_size': self.neural_generator.vocab_size
            },
            'available_topics': ['aritmetica', 'algebra', 'geometria', 'fracciones'],
            'available_difficulties': ['basico', 'intermedio', 'avanzado']
        }


# Función de demostración
def demo_hybrid_model():
    """Función de demostración del modelo híbrido"""
    print("🚀 DEMOSTRACIÓN DEL MODELO HÍBRIDO")
    print("=" * 50)

    # Crear modelo
    model = HybridMathModel()

    # Perfil de usuario de ejemplo
    usuario = {
        'edad': 12,
        'rendimiento': 0.7,
        'preferencia_visual': 0.5
    }

    # Generar ejercicios de diferentes tipos
    topics = ['aritmetica', 'algebra', 'geometria', 'fracciones']
    difficulties = ['basico', 'intermedio']

    for topic in topics:
        for difficulty in difficulties:
            print(f"\n📚 {topic.upper()} - {difficulty.upper()}")
            print("-" * 40)

            exercise = model.generate_validated_exercise(topic, difficulty, usuario)

            print(f"🔢 PROBLEMA: {exercise['problem']}")
            print(f"✅ RESPUESTA: {exercise['answer']}")
            print(f"📋 PASOS:")
            for i, step in enumerate(exercise['steps'], 1):
                print(f"   {i}. {step}")

            validation = exercise['validation']
            print(f"🔍 VALIDACIÓN: {'✅ Válido' if validation['is_valid'] else '❌ Inválido'}")
            print(f"📊 CONFIANZA: {validation['confidence']:.2f}")
            print(f"🎯 INTENTOS: {validation['attempts_needed']}")

    # Mostrar estadísticas
    print(f"\n📈 ESTADÍSTICAS DEL MODELO:")
    stats = model.get_model_stats()
    print(f"   Ejercicios generados: {stats['generation_stats']['total_generated']}")
    print(f"   Validaciones exitosas: {stats['generation_stats']['successful_validations']}")
    print(f"   Promedio de intentos: {stats['generation_stats']['average_attempts']:.2f}")

    return model


if __name__ == "__main__":
    # Ejecutar demostración
    demo_model = demo_hybrid_model()

    # Guardar modelo de ejemplo
    demo_model.save_model("hybrid_math_model.json")
    print("\n💾 Modelo de demostración guardado!")