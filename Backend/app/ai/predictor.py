"""
Predictor de Completado de Hábitos - Random Forest

Este módulo implementa un modelo de Machine Learning para predecir
la probabilidad de que un usuario complete un hábito en un día dado.

Modelo Matemático - Random Forest:

    Predicción = Modo(árbol₁, árbol₂, ..., árbolₙ)
    
    Cada árbol usa Gini Impurity para decidir splits:
    Gini(S) = 1 - Σᵢ pᵢ²
    
    Donde pᵢ = proporción de clase i en el nodo S

Features utilizadas:
- dia_semana: 0-6 (Lunes=0, Domingo=6)
- racha_actual: días consecutivos completando
- tasa_exito_7_dias: % completado últimos 7 días
- completado_ayer: 0 o 1
- dias_desde_agregado: antigüedad del hábito

El modelo se entrena con datos históricos de seguimiento_habitos.
"""

import numpy as np
import joblib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from .feature_extractor import FeatureExtractor


class HabitPredictor:
    """
    Predictor de probabilidad de completar hábitos usando Random Forest.
    
    El modelo aprende de patrones históricos de completado y predice
    la probabilidad de que el usuario complete cada hábito hoy.
    """
    
    # Nombres de las features en orden
    FEATURE_NAMES = [
        'dia_semana',
        'racha_actual', 
        'tasa_exito_7_dias',
        'completado_ayer',
        'dias_desde_agregado'
    ]
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Inicializa el predictor.
        
        Args:
            model_path: Ruta al modelo guardado (opcional)
        """
        self.feature_extractor = FeatureExtractor()
        self.model = None
        self.is_trained = False
        self.training_accuracy = None
        self.model_path = model_path or str(
            Path(__file__).parent / 'models' / 'predictor.pkl'
        )
        
        # Intentar cargar modelo existente
        if Path(self.model_path).exists():
            self.load_model()
    
    def _create_model(self) -> RandomForestClassifier:
        """
        Crea una nueva instancia del modelo Random Forest.
        
        Hiperparámetros elegidos para balance entre rendimiento y velocidad:
        - n_estimators=100: 100 árboles en el bosque
        - max_depth=10: Profundidad máxima para evitar overfitting
        - min_samples_split=5: Mínimo de muestras para dividir un nodo
        - random_state=42: Reproducibilidad
        """
        return RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1  # Usar todos los cores
        )
    
    def train(self, test_size: float = 0.2, save: bool = True) -> Dict:
        """
        Entrena el modelo con datos históricos.
        
        Proceso:
        1. Obtener datos de entrenamiento del FeatureExtractor
        2. Dividir en train/test
        3. Entrenar Random Forest
        4. Evaluar y reportar métricas
        5. Guardar modelo (opcional)
        
        Args:
            test_size: Proporción de datos para test (default 20%)
            save: Si guardar el modelo después de entrenar
            
        Returns:
            Dict con métricas de entrenamiento
        """
        print("📊 Obteniendo datos de entrenamiento...")
        X, y = self.feature_extractor.get_training_data_for_predictor(min_records=50)
        
        if len(X) < 50:
            return {
                'success': False,
                'error': f'Insuficientes datos de entrenamiento ({len(X)} registros)',
                'min_required': 50
            }
        
        print(f"   Registros totales: {len(X)}")
        print(f"   Positivos (completados): {sum(y)}")
        print(f"   Negativos (no completados): {len(y) - sum(y)}")
        
        # Dividir en train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"\n🌲 Entrenando Random Forest...")
        print(f"   Train: {len(X_train)} registros")
        print(f"   Test: {len(X_test)} registros")
        
        # Crear y entrenar modelo
        self.model = self._create_model()
        self.model.fit(X_train, y_train)
        
        # Evaluar
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        self.training_accuracy = accuracy
        self.is_trained = True
        
        print(f"\n✅ Entrenamiento completado!")
        print(f"   Accuracy: {accuracy:.2%}")
        
        # Feature importance
        importances = dict(zip(self.FEATURE_NAMES, self.model.feature_importances_))
        sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        
        print(f"\n📈 Importancia de features:")
        for name, importance in sorted_importances:
            print(f"   {name}: {importance:.3f}")
        
        # Guardar modelo
        if save:
            self.save_model()
        
        return {
            'success': True,
            'total_records': len(X),
            'train_records': len(X_train),
            'test_records': len(X_test),
            'accuracy': round(accuracy, 4),
            'feature_importance': {k: round(v, 4) for k, v in importances.items()}
        }
    
    def predict(self, user_id: int, habito_usuario_id: int) -> Optional[Dict]:
        """
        Predice la probabilidad de completar un hábito hoy.
        
        Args:
            user_id: ID del usuario
            habito_usuario_id: ID del hábito del usuario
            
        Returns:
            Dict con probabilidad y factores, o None si no hay modelo
        """
        if not self.is_trained:
            # Intentar cargar modelo
            if not self.load_model():
                return None
        
        # Obtener features actuales
        features = self.feature_extractor.get_habit_completion_features(
            user_id, habito_usuario_id
        )
        
        if not features:
            return None
        
        # Construir vector de features en el orden correcto
        X = np.array([[
            features['dia_semana'],
            features['racha_actual'],
            features['tasa_exito_7_dias'],
            features['completado_ayer'],
            features['dias_desde_agregado']
        ]], dtype=np.float32)
        
        # Predecir probabilidad
        proba = self.model.predict_proba(X)[0]
        prob_completar = float(proba[1]) if len(proba) > 1 else float(proba[0])
        
        # Analizar factores
        factores_positivos, factores_negativos = self._analyze_factors(features)
        
        return {
            'probabilidad': round(prob_completar, 3),
            'features': features,
            'factores_positivos': factores_positivos,
            'factores_negativos': factores_negativos
        }
    
    def predict_all_habits(self, user_id: int) -> List[Dict]:
        """
        Predice probabilidad para TODOS los hábitos activos del usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de predicciones ordenadas por probabilidad (mayor primero)
        """
        if not self.is_trained:
            if not self.load_model():
                return []
        
        # Obtener todos los hábitos con sus features
        habits_features = self.feature_extractor.get_all_user_habits_features(user_id)
        
        if not habits_features:
            return []
        
        predictions = []
        
        for habit in habits_features:
            features = habit['features']
            
            # Construir vector
            X = np.array([[
                features['dia_semana'],
                features['racha_actual'],
                features['tasa_exito_7_dias'],
                features['completado_ayer'],
                features['dias_desde_agregado']
            ]], dtype=np.float32)
            
            # Predecir
            proba = self.model.predict_proba(X)[0]
            prob_completar = float(proba[1]) if len(proba) > 1 else float(proba[0])
            
            # Analizar factores
            factores_pos, factores_neg = self._analyze_factors(features)
            
            predictions.append({
                'habito_usuario_id': habit['habito_usuario_id'],
                'habito_id': habit['habito_id'],
                'nombre': habit['nombre'],
                'probabilidad': round(prob_completar, 3),
                'factores_positivos': factores_pos,
                'factores_negativos': factores_neg
            })
        
        # Ordenar por probabilidad descendente
        predictions.sort(key=lambda x: x['probabilidad'], reverse=True)
        
        return predictions
    
    def _analyze_factors(self, features: Dict) -> Tuple[List[str], List[str]]:
        """
        Analiza las features y genera explicaciones legibles.
        
        Args:
            features: Dict de features del hábito
            
        Returns:
            Tuple de (factores_positivos, factores_negativos)
        """
        positivos = []
        negativos = []
        
        # Racha
        racha = features.get('racha_actual', 0)
        if racha >= 7:
            positivos.append(f"racha de {racha} días")
        elif racha >= 3:
            positivos.append(f"racha de {racha} días")
        elif racha == 0:
            negativos.append("sin racha activa")
        
        # Completado ayer
        if features.get('completado_ayer', 0) == 1:
            positivos.append("completaste ayer")
        else:
            negativos.append("no completaste ayer")
        
        # Tasa de éxito reciente
        tasa_7 = features.get('tasa_exito_7_dias', 0)
        if tasa_7 >= 0.8:
            positivos.append(f"alta tasa reciente ({int(tasa_7*100)}%)")
        elif tasa_7 < 0.3:
            negativos.append(f"baja tasa reciente ({int(tasa_7*100)}%)")
        
        # Día de la semana
        dia = features.get('dia_semana', 0)
        dias_nombres = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        if dia >= 5:  # Fin de semana
            negativos.append(f"es {dias_nombres[dia]}")
        
        # Antigüedad del hábito
        dias_agregado = features.get('dias_desde_agregado', 0)
        if dias_agregado >= 30:
            positivos.append("hábito establecido")
        elif dias_agregado < 7:
            negativos.append("hábito nuevo")
        
        return positivos, negativos
    
    def save_model(self, path: Optional[str] = None) -> bool:
        """
        Guarda el modelo entrenado en disco.
        
        Args:
            path: Ruta donde guardar (usa default si no se especifica)
            
        Returns:
            True si se guardó correctamente
        """
        if not self.is_trained:
            print("⚠️ No hay modelo entrenado para guardar")
            return False
        
        save_path = path or self.model_path
        
        # Crear directorio si no existe
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Guardar modelo y metadata
        data = {
            'model': self.model,
            'feature_names': self.FEATURE_NAMES,
            'training_accuracy': self.training_accuracy
        }
        
        joblib.dump(data, save_path)
        print(f"💾 Modelo guardado en: {save_path}")
        
        return True
    
    def load_model(self, path: Optional[str] = None) -> bool:
        """
        Carga un modelo guardado desde disco.
        
        Args:
            path: Ruta del modelo (usa default si no se especifica)
            
        Returns:
            True si se cargó correctamente
        """
        load_path = path or self.model_path
        
        if not Path(load_path).exists():
            return False
        
        try:
            data = joblib.load(load_path)
            self.model = data['model']
            self.training_accuracy = data.get('training_accuracy')
            self.is_trained = True
            print(f"📂 Modelo cargado desde: {load_path}")
            return True
        except Exception as e:
            print(f"❌ Error cargando modelo: {e}")
            return False
    
    def get_model_info(self) -> Dict:
        """
        Retorna información sobre el estado del modelo.
        """
        return {
            'is_trained': self.is_trained,
            'model_path': self.model_path,
            'model_exists': Path(self.model_path).exists(),
            'training_accuracy': self.training_accuracy,
            'feature_names': self.FEATURE_NAMES,
            'n_estimators': self.model.n_estimators if self.model else None,
            'max_depth': self.model.max_depth if self.model else None
        }
