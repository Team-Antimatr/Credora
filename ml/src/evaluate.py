"""
Credora ML Evaluation Module:
Evaluates baseline Logistic Regression model, calculates business-critical
credit risk metrics, and generates visual plots (Confusion Matrix, ROC Curve).
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Headless backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report
)

from ml.src.train import train_logistic_regression


def evaluate_model(
    model, 
    scaler, 
    feature_names, 
    X_test, 
    y_test, 
    reports_dir: str = "ml/reports"
) -> dict:
    """
    Computes credit evaluation metrics, exports plots, and saves summary JSON.
    """
    os.makedirs(reports_dir, exist_ok=True)

    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    # Calculate metrics
    accuracy = float(accuracy_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    precision_approved = float(precision_score(y_test, y_pred, pos_label=1))
    recall_approved = float(recall_score(y_test, y_pred, pos_label=1))
    f1_approved = float(f1_score(y_test, y_pred, pos_label=1))

    precision_rejected = float(precision_score(y_test, y_pred, pos_label=0))
    recall_rejected = float(recall_score(y_test, y_pred, pos_label=0))
    f1_rejected = float(f1_score(y_test, y_pred, pos_label=0))

    macro_f1 = float(f1_score(y_test, y_pred, average='macro'))
    weighted_f1 = float(f1_score(y_test, y_pred, average='weighted'))

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    # Extract top feature weights (odds ratios)
    coefs = pd.DataFrame({
        'feature': feature_names,
        'coefficient': model.coef_[0],
        'odds_ratio': np.exp(model.coef_[0])
    }).sort_values('coefficient', ascending=False)

    top_positive_features = coefs.head(5).to_dict(orient='records')
    top_negative_features = coefs.tail(5).to_dict(orient='records')

    metrics_summary = {
        "model_type": "Logistic Regression (L2 Regularized)",
        "model_version": "Credora-v1.0-Baseline",
        "sample_counts": {
            "test_set_total": len(y_test),
            "actual_rejected_0": int((y_test == 0).sum()),
            "actual_approved_1": int((y_test == 1).sum())
        },
        "performance_metrics": {
            "accuracy": round(accuracy, 4),
            "roc_auc_score": round(roc_auc, 4),
            "approved_class_1": {
                "precision": round(precision_approved, 4),
                "recall": round(recall_approved, 4),
                "f1_score": round(f1_approved, 4)
            },
            "rejected_class_0": {
                "precision": round(precision_rejected, 4),
                "recall": round(recall_rejected, 4),
                "f1_score": round(f1_rejected, 4)
            },
            "macro_f1": round(macro_f1, 4),
            "weighted_f1": round(weighted_f1, 4)
        },
        "confusion_matrix": {
            "true_negatives_tn": tn,
            "false_positives_fp": fp,
            "false_negatives_fn": fn,
            "true_positives_tp": tp
        },
        "key_drivers": {
            "top_approval_drivers": top_positive_features,
            "top_risk_drivers": top_negative_features
        }
    }

    # Save metrics JSON
    metrics_path = os.path.join(reports_dir, "metrics_summary.json")
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_summary, f, indent=2)

    # 1. Confusion Matrix Heatmap
    cm_path = os.path.join(reports_dir, "confusion_matrix.png")
    plt.figure(figsize=(7, 5.5), dpi=300)
    sns.heatmap(
        cm, 
        annot=True, 
        fmt='d', 
        cmap='Blues', 
        cbar=False,
        xticklabels=['Predicted Rejected (0)', 'Predicted Approved (1)'],
        yticklabels=['Actual Rejected (0)', 'Actual Approved (1)'],
        annot_kws={"size": 16, "weight": "bold"}
    )
    plt.title("Credora Baseline Model — Confusion Matrix", fontsize=14, pad=15, weight='bold')
    plt.ylabel("Ground Truth", fontsize=12)
    plt.xlabel("Model Prediction", fontsize=12)
    plt.tight_layout()
    plt.savefig(cm_path)
    plt.close()

    # 2. ROC-AUC Curve
    roc_path = os.path.join(reports_dir, "roc_curve.png")
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    plt.figure(figsize=(7, 5.5), dpi=300)
    plt.plot(fpr, tpr, color='#0066FF', lw=2.5, label=f'Logistic Regression (AUC = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], color='#94A3B8', lw=1.5, linestyle='--', label='Random Chance (AUC = 0.50)')
    plt.xlim([-0.02, 1.02])
    plt.ylim([-0.02, 1.05])
    plt.xlabel('False Positive Rate (1 - Specificity)', fontsize=12)
    plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=12)
    plt.title('Receiver Operating Characteristic (ROC) Curve', fontsize=14, pad=15, weight='bold')
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.legend(loc="lower right", fontsize=11, frameon=True)
    plt.tight_layout()
    plt.savefig(roc_path)
    plt.close()

    print("\n" + "="*60)
    print("CREDORA ML BASELINE EVALUATION REPORT")
    print("="*60)
    print(f"Overall Accuracy:  {accuracy*100:.2f}%")
    print(f"ROC-AUC Score:     {roc_auc:.4f}  (Target >= 0.82: {'PASSED [OK]' if roc_auc >= 0.82 else 'FAILED'})")
    print(f"Macro F1-Score:    {macro_f1:.4f}")
    print(f"Weighted F1-Score: {weighted_f1:.4f}")
    print("\nConfusion Matrix Breakdown:")
    print(f"  True Negatives (TN):  {tn} (Correctly predicted Rejected)")
    print(f"  False Positives (FP): {fp} (Risk: Approved bad borrower)")
    print(f"  False Negatives (FN): {fn} (Lost opportunity: Rejected good borrower)")
    print(f"  True Positives (TP):  {tp} (Correctly predicted Approved)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Rejected (0)', 'Approved (1)']))
    print(f"Reports saved to: {reports_dir}/")
    print("="*60 + "\n")

    return metrics_summary


def run_full_pipeline():
    """Trains and evaluates the model."""
    model, scaler, feature_names, X_test, y_test = train_logistic_regression()
    evaluate_model(model, scaler, feature_names, X_test, y_test)


if __name__ == "__main__":
    run_full_pipeline()
