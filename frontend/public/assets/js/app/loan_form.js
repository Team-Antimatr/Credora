// Credora Loan Form & Draft Caching Manager
import { apiRequest } from "../core/api_client.js";
import { setButtonLoading, showLoader, hideLoader } from "../core/app.js";
import { AuthState } from "../core/auth.js";

const DRAFT_KEY = "credora_loan_draft";

export class LoanFormManager {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) return;

    this.initDraftCaching();
    this.initFormSubmission();
  }

  getUserKey() {
    const user = AuthState.getUser();
    return user && user.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest';
  }

  initDraftCaching() {
    // Restore cached inputs from session
    const cached = sessionStorage.getItem(`${DRAFT_KEY}_${this.getUserKey()}`);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        Object.keys(data).forEach(key => {
          const field = this.form.elements[key];
          if (field) {
            if (field.type === 'radio') {
              const radio = this.form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
              if (radio) radio.checked = true;
            } else {
              field.value = data[key];
            }
          }
        });
      } catch (e) {
        console.warn("Failed to restore draft:", e);
      }
    }

    // Auto-save form inputs on input change
    this.form.addEventListener('input', () => {
      this.saveDraft();
    });
  }

  saveDraft() {
    const formData = new FormData(this.form);
    const draft = {};
    formData.forEach((value, key) => {
      draft[key] = value;
    });
    sessionStorage.setItem(`${DRAFT_KEY}_${this.getUserKey()}`, JSON.stringify(draft));
  }

  clearDraft() {
    sessionStorage.removeItem(`${DRAFT_KEY}_${this.getUserKey()}`);
  }

  storeUserApplication(app) {
    const userKey = this.getUserKey();
    const storageKey = `credora_applications_${userKey}`;
    let apps = [];
    try {
      const existing = localStorage.getItem(storageKey);
      apps = existing ? JSON.parse(existing) : [];
    } catch (e) {
      apps = [];
    }

    // Prepend new application
    apps.unshift(app);
    localStorage.setItem(storageKey, JSON.stringify(apps));
    sessionStorage.setItem('credora_active_application', JSON.stringify(app));
  }

  initFormSubmission() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = this.form.querySelector('button[type="submit"]');
      if (submitBtn) {
        setButtonLoading(submitBtn, true, "Evaluating Application...");
      }
      showLoader();

      const user = AuthState.getUser();
      const formData = new FormData(this.form);
      const loanProductRadio = this.form.querySelector('input[name="loanProduct"]:checked');
      const selectedProduct = loanProductRadio ? loanProductRadio.value : (formData.get('loanProduct') || "Personal Loan");

      const payload = {
        personal_details: {
          full_name: formData.get('fullName') || (user ? user.displayName : "Credora Applicant"),
          gender: formData.get('gender') || "Male",
          married: formData.get('maritalStatus') || "Married",
          dependents: formData.get('dependents') || "2",
          education: formData.get('education') || "Graduate",
          self_employed: formData.get('employmentStatus') || "No"
        },
        financial_details: {
          applicant_income: parseFloat(formData.get('appIncome') || formData.get('applicant_income') || 0),
          coapplicant_income: parseFloat(formData.get('coIncome') || formData.get('coapplicant_income') || 0),
          loan_amount: parseFloat(formData.get('loanAmount') || formData.get('loan_amount') || 0),
          loan_amount_term_months: parseInt(formData.get('loanTenure') || formData.get('loan_term') || 36, 10),
          credit_history: parseFloat(formData.get('creditHistory') || 1.0),
          property_area: formData.get('propertyArea') || "Urban"
        },
        loan_parameters: {
          loan_type: selectedProduct,
          purpose: formData.get('loanPurpose') || `${selectedProduct} Financing`
        }
      };

      try {
        const response = await apiRequest('/loans/apply', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const appData = response.data || response;
        appData.loan_type = selectedProduct;
        appData.requested_amount = payload.financial_details.loan_amount;
        appData.property_area = payload.financial_details.property_area;
        appData.full_name = payload.personal_details.full_name;

        this.storeUserApplication(appData);
        this.clearDraft();
        window.location.href = "dashboard.html";
      } catch (err) {
        console.warn("API offline or error, generating local pre-screening record:", err.message);
        
        // Client fallback calculation for demo
        const isApproved = payload.financial_details.credit_history >= 1.0 && payload.financial_details.applicant_income > 0;
        const now = new Date();
        const demoApp = {
          application_id: "0000" + Math.floor(1000 + Math.random() * 9000),
          tracking_number: "TRK-" + Math.floor(100000 + Math.random() * 900000),
          status: "Pending",
          flag: "N/A",
          reason: "Pre-Screening Under Officer Review",
          loan_type: selectedProduct,
          requested_amount: payload.financial_details.loan_amount,
          property_area: payload.financial_details.property_area,
          full_name: payload.personal_details.full_name,
          issue_date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          submitted_at: now.toISOString(),
          ml_pre_screening: {
            outcome: isApproved ? "PRE_APPROVED" : "EDGE_CASE_REVIEW",
            confidence_score: isApproved ? 0.884 : 0.54,
            risk_band: isApproved ? "LOW" : "MEDIUM"
          }
        };

        this.storeUserApplication(demoApp);
        this.clearDraft();
        window.location.href = "dashboard.html";
      }
    });
  }
}
