// Credora Dashboard Manager — Handles Empty States & Dynamic User Applications
import { AuthState } from "../core/auth.js";

export class DashboardManager {
  constructor() {
    this.user = AuthState.getUser();
    this.userKey = this.getUserKey();
    this.init();
  }

  getUserKey() {
    return this.user && this.user.email ? this.user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest';
  }

  getApplications() {
    // Purge legacy unscoped session key to prevent cross-account pollution
    sessionStorage.removeItem('credora_active_application');

    const currentUserEmail = this.user && this.user.email ? this.user.email.toLowerCase() : '';
    const storageKey = `credora_applications_${this.userKey}`;
    let apps = [];

    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          apps = parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading user applications:", e);
    }

    // Strict account isolation: verify ownership against currently logged-in user email
    // Any record lacking applicant_email or belonging to another email was leaked and is purged
    const originalCount = apps.length;
    apps = apps.filter(a => {
      if (!a) return false;
      return a.applicant_email && a.applicant_email.toLowerCase() === currentUserEmail;
    });

    // Check user-scoped session storage in case of fresh submission redirect
    const userSessionApp = sessionStorage.getItem(`credora_active_application_${this.userKey}`);
    if (userSessionApp) {
      try {
        const parsedSession = JSON.parse(userSessionApp);
        if (parsedSession && parsedSession.applicant_email === currentUserEmail) {
          const alreadyExists = apps.some(a => a.application_id === parsedSession.application_id);
          if (!alreadyExists) {
            apps.unshift(parsedSession);
          }
        }
      } catch (e) {
        console.warn("Error checking user session application:", e);
      }
    }

    // Resave cleaned list if any foreign or legacy records were purged
    if (apps.length !== originalCount) {
      localStorage.setItem(storageKey, JSON.stringify(apps));
    }

    return apps;
  }

  formatINR(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  }

  init() {
    const apps = this.getApplications();
    this.updateMetrics(apps);
    this.renderState(apps);
    this.initModalListeners();
  }

  updateMetrics(apps) {
    const totalCount = apps.length;
    const approvedCount = apps.filter(a => 
      a.status === 'Approved' || 
      (a.ml_pre_screening && a.ml_pre_screening.outcome === 'PRE_APPROVED')
    ).length;
    const activeLoansCount = approvedCount > 0 ? approvedCount : (totalCount > 0 ? 1 : 0);

    const activeLoansEl = document.getElementById('metricActiveLoans');
    const totalRegEl = document.getElementById('metricTotalRegister');
    const totalApprovedEl = document.getElementById('metricTotalApproved');

    if (activeLoansEl) activeLoansEl.textContent = activeLoansCount;
    if (totalRegEl) totalRegEl.textContent = totalCount;
    if (totalApprovedEl) totalApprovedEl.textContent = approvedCount;
  }

  renderState(apps) {
    const emptyContainer = document.getElementById('emptyStateContainer');
    const activeContainer = document.getElementById('activeStateContainer');
    const tableBody = document.getElementById('applicationsTableBody');

    if (!apps || apps.length === 0) {
      if (emptyContainer) emptyContainer.classList.remove('hidden');
      if (activeContainer) activeContainer.classList.add('hidden');
      return;
    }

    // User has applications — show active state
    if (emptyContainer) emptyContainer.classList.add('hidden');
    if (activeContainer) activeContainer.classList.remove('hidden');

    if (tableBody) {
      tableBody.innerHTML = '';
      apps.forEach((app, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors border-b border-borderHairline";

        const appId = app.application_id || `0000${1250 + index}`;
        const isApproved = app.status === 'Approved' || (app.ml_pre_screening && app.ml_pre_screening.outcome === 'PRE_APPROVED');
        const statusText = app.status === 'Approved' ? 'Approved' : (isApproved ? 'Pre-Approved' : (app.status || 'Pending'));
        const statusClass = statusText === 'Approved' 
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
          : (statusText === 'Pre-Approved' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200');

        const flagText = app.flag || (app.ml_pre_screening ? `${app.ml_pre_screening.risk_band || 'LOW'} RISK` : 'N/A');
        const reasonText = app.reason || (isApproved ? 'Automated Pre-Screening Passed' : 'Under Officer Review');
        const issueDate = app.issue_date || (app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today');

        tr.innerHTML = `
          <td class="py-4 px-6 text-[14px] text-ink font-medium whitespace-nowrap">
            ${appId}
          </td>
          <td class="py-4 px-6 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium ${statusClass}">
              <span class="w-1.5 h-1.5 rounded-full ${statusText === 'Approved' ? 'bg-emerald-600' : (statusText === 'Pre-Approved' ? 'bg-blue-600' : 'bg-amber-500')}"></span>
              ${statusText}
            </span>
          </td>
          <td class="py-4 px-6 text-[13px] text-slateMuted whitespace-nowrap">
            ${flagText}
          </td>
          <td class="py-4 px-6 text-[14px] text-slateBody max-w-xs truncate">
            ${reasonText}
          </td>
          <td class="py-4 px-6 text-[14px] text-slateMuted whitespace-nowrap">
            ${issueDate}
          </td>
          <td class="py-4 px-6 text-right whitespace-nowrap">
            <button type="button" class="view-app-btn inline-flex items-center text-[13px] font-medium text-trustBlue hover:underline transition-colors" data-index="${index}">
              View Status →
            </button>
          </td>
        `;

        tableBody.appendChild(tr);
      });

      // Hook view buttons
      tableBody.querySelectorAll('.view-app-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          this.openDetailsModal(apps[idx]);
        });
      });
    }
  }

  openDetailsModal(app) {
    const modal = document.getElementById('applicationDetailModal');
    if (!modal) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const formatEmployment = (val) => {
      if (val === 'Yes') return 'Self-Employed';
      if (val === 'No') return 'Salaried Professional';
      if (val === 'Contract') return 'Freelancer / Contract';
      return val || 'Salaried Professional';
    };

    const appId = app.application_id || 'CRD-2026-0001';
    const amount = app.loan_amount || app.requested_amount || (app.financial_details ? app.financial_details.loan_amount : 500000);
    const product = app.loan_type || 'Personal Loan';
    const applicantName = app.full_name || (this.user ? this.user.displayName : 'Borrower');

    setVal('modalAppId', appId);
    setVal('modalApplicantName', applicantName);
    setVal('modalSubtitle', `Submitted on ${app.issue_date || '24 Nov 2026'}`);
    setVal('modalProduct', product);
    setVal('modalAmount', this.formatINR(amount));
    setVal('modalTenure', `${app.loan_tenure || 36} Months`);
    setVal('modalAge', `${app.age || 28} Years`);
    setVal('modalGender', app.gender || 'Male');
    setVal('modalEmployment', formatEmployment(app.employment));
    setVal('modalIncome', `${this.formatINR(app.income || 50000)} / mo`);
    setVal('modalCreditScore', `${app.credit_score || 750}`);

    const statusBadge = document.getElementById('modalStatusBadge');
    if (statusBadge) {
      const isApproved = app.status === 'Approved';
      const isDenied = app.status === 'Denied' || app.status === 'Rejected';
      const isHold = app.status === 'Hold' || app.status === 'On Hold';

      if (isApproved) {
        statusBadge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>`;
      } else if (isDenied) {
        statusBadge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Denied</span>`;
      } else if (isHold) {
        statusBadge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">On Hold</span>`;
      } else {
        statusBadge.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Pending Review</span>`;
      }
    }

    modal.classList.remove('hidden');
  }

  initModalListeners() {
    const modal = document.getElementById('applicationDetailModal');
    const closeBtn = document.getElementById('closeModalBtn');
    const overlay = document.getElementById('modalOverlay');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (overlay && modal) {
      overlay.addEventListener('click', () => modal.classList.add('hidden'));
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});
