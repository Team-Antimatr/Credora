"""
Credora ML Preprocessing Module:
Handles missing value imputation, categorical one-hot encoding,
and StandardScaler feature normalization per Credora ML pipeline specs.
"""

import json
import os
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Optional
from sklearn.preprocessing import StandardScaler
import joblib


def load_raw_data(filepath: str) -> pd.DataFrame:
    """Loads raw loan dataset from CSV."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Raw data file not found at: {filepath}")
    return pd.read_csv(filepath)


def clean_and_impute(
    df: pd.DataFrame, 
    imputation_values: Optional[Dict] = None
) -> Tuple[pd.DataFrame, Dict]:
    """
    Cleans raw data by dropping applicant IDs, discarding rows missing target,
    and imputing numerical (median) and categorical (mode) features.
    """
    df = df.copy()

    # Drop unique ID if present
    if 'Applicant_ID' in df.columns:
        df = df.drop(columns=['Applicant_ID'])

    # Drop rows missing target variable
    if 'Loan_Approved' in df.columns:
        df = df.dropna(subset=['Loan_Approved'])

    # Separate numeric and categorical column names
    numeric_cols = [c for c in df.columns if c != 'Loan_Approved' and pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in df.columns if c != 'Loan_Approved' and not pd.api.types.is_numeric_dtype(df[c])]

    if imputation_values is None:
        imputation_values = {
            'numeric': {},
            'categorical': {}
        }
        for col in numeric_cols:
            median_val = float(df[col].median())
            imputation_values['numeric'][col] = median_val
            df[col] = df[col].fillna(median_val)

        for col in categorical_cols:
            mode_val = str(df[col].mode()[0])
            imputation_values['categorical'][col] = mode_val
            df[col] = df[col].fillna(mode_val)
    else:
        for col in numeric_cols:
            val = imputation_values['numeric'].get(col, 0.0)
            df[col] = df[col].fillna(val)

        for col in categorical_cols:
            val = imputation_values['categorical'].get(col, "Unknown")
            df[col] = df[col].fillna(val)

    return df, imputation_values


def encode_and_split_xy(
    df: pd.DataFrame, 
    target_col: str = 'Loan_Approved',
    feature_names: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, Optional[pd.Series], List[str]]:
    """
    Performs One-Hot Encoding for categorical features and separates X and y.
    """
    df = df.copy()

    y = None
    if target_col in df.columns:
        # Binary target mapping: Yes -> 1, No -> 0
        y = (df[target_col] == 'Yes').astype(int)
        X = df.drop(columns=[target_col])
    else:
        X = df

    categorical_cols = [c for c in X.columns if not pd.api.types.is_numeric_dtype(X[c])]
    X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=True)

    if feature_names is not None:
        # Align to expected feature schema during inference
        for col in feature_names:
            if col not in X_encoded.columns:
                X_encoded[col] = 0
        X_encoded = X_encoded[feature_names]
    else:
        feature_names = list(X_encoded.columns)

    return X_encoded, y, feature_names


def scale_features(
    X_train: pd.DataFrame, 
    X_test: Optional[pd.DataFrame] = None, 
    scaler: Optional[StandardScaler] = None
) -> Tuple[np.ndarray, Optional[np.ndarray], StandardScaler]:
    """
    Scales features with StandardScaler.
    """
    if scaler is None:
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
    else:
        X_train_scaled = scaler.transform(X_train)

    X_test_scaled = None
    if X_test is not None:
        X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, scaler


def run_preprocessing_pipeline(
    raw_path: str = "ml/data/raw_loan_data.csv",
    output_processed_path: str = "ml/data/processed_loan_data.csv"
) -> Tuple[pd.DataFrame, pd.Series, List[str], StandardScaler]:
    """
    End-to-end preprocessing runner.
    """
    df_raw = load_raw_data(raw_path)
    df_clean, impute_vals = clean_and_impute(df_raw)
    X_encoded, y, feature_names = encode_and_split_xy(df_clean)

    # Export processed data for reproducibility
    processed_df = X_encoded.copy()
    processed_df['Loan_Approved'] = y
    os.makedirs(os.path.dirname(output_processed_path), exist_ok=True)
    processed_df.to_csv(output_processed_path, index=False)

    print(f"[Preprocessing] Cleaned {len(df_clean)} records. Encoded features: {len(feature_names)}")
    print(f"[Preprocessing] Processed dataset saved to: {output_processed_path}")

    return X_encoded, y, feature_names, impute_vals


if __name__ == "__main__":
    run_preprocessing_pipeline()
