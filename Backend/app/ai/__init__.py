"""
Taskpin AI Module

Este módulo contiene los componentes de inteligencia artificial:
- feature_extractor: Extracción de características para modelos
- recommender: Sistema de recomendación de hábitos (filtrado colaborativo)
- predictor: Predicción de completado de hábitos (Random Forest)
"""

from .feature_extractor import FeatureExtractor
from .recommender import HabitRecommender
from .predictor import HabitPredictor

__all__ = ['FeatureExtractor', 'HabitRecommender', 'HabitPredictor']
