"""
Credora ML Training Module:
Trains baseline Logistic Regression model with L2 regularization
and serializes model artifacts.
"""

import json
import os
import shutil
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from ml.src.preprocess import (
    load_raw_data, 
    clean_and_impute, 
    encode_and_split_xy, 
    scale_features
)


def train_logistic_regression(
    raw_data_path: str = "ml/data/raw_loan_data.csv",
    models_dir: str = "ml/models",
    test_size: float = 0.20,
    random_state: int = 42,
    C: float = 1.0,
    max_iter: int = 1000
) -> Tuple[LogisticRegression, StandardScaler, list, pd.DataFrame, pd.Series]:
    """
    Trains a Logistic Regression baseline model on credit risk data.
    """
    os.makedirs(models_dir, exist_ok=True)

    # 1. Load and Preprocess
    print("[Training] Loading raw data...")
    df_raw = load_raw_data(raw_data_path)
    df_clean, impute_vals = clean_and_impute(df_raw)
    X_encoded, y, feature_names = encode_and_split_xy(df_clean)

    # 2. Train-Test Split (Stratified 80/20)
    print(f"[Training] Splitting data ({int((1-test_size)*100)}/{int(test_size*100)} stratified split)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, 
        test_size=test_size, 
        random_state=random_state, 
        stratify=y
    )

    # 3. Standardize Features
    print("[Training] Fitting StandardScaler...")
    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)

    # 4. Train Model with L2 Regularization
    print(f"[Training] Fitting Logistic Regression (C={C}, L2 penalty, max_iter={max_iter})...")
    model = LogisticRegression(
        C=C, 
        penalty='l2', 
        solver='lbfgs', 
        max_iter=max_iter, 
        random_state=random_state
    )
    model.fit(X_train_scaled, y_train)

    # 5. Serialize Artifacts
    model_path = os.path.join(models_dir, "logistic_regression.joblib")
    scaler_path = os.path.join(models_dir, "scaler.joblib")
    features_path = os.path.join(models_dir, "feature_names.json")
    impute_path = os.path.join(models_dir, "imputation_values.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    with open(features_path, 'w', encoding='utf-8') as f:
        json.dump(feature_names, f, indent=2)
    with open(impute_path, 'w', encoding='utf-8') as f:
        json.dump(impute_vals, f, indent=2)

    print(f"[Training] Artifacts saved:")
    print(f"  - Model: {model_path}")
    print(f"  - Scaler: {scaler_path}")
    print(f"  - Schema: {features_path}")

    # Copy to backend/app/ml/ for active production API serving
    backend_models_dir = "backend/app/ml/models"
    backend_artifacts_dir = "backend/app/ml/artifacts"
    os.makedirs(backend_models_dir, exist_ok=True)
    os.makedirs(backend_artifacts_dir, exist_ok=True)

    shutil.copy(model_path, os.path.join(backend_models_dir, "logistic_regression.joblib"))
    shutil.copy(scaler_path, os.path.join(backend_artifacts_dir, "scaler.joblib"))
    shutil.copy(features_path, os.path.join(backend_artifacts_dir, "feature_names.json"))
    shutil.copy(impute_path, os.path.join(backend_artifacts_dir, "imputation_values.json"))
    print("[Training] Synced artifacts to backend API serving directory.")

    return model, scaler, feature_names, X_test, y_test


if __name__ == "__main__":
    train_logistic_regression()
