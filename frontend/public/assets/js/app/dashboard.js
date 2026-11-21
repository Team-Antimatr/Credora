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
    const storageKey = `credora_applications_${this.userKey}`;
    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        const apps = JSON.parse(data);
        if (Array.isArray(apps)) return apps;
      }
    } catch (e) {
      console.warn("Error reading user applications:", e);
    }

    // Check if an active session application was just submitted
    const sessionApp = sessionStorage.getItem('credora_active_application');
    if (sessionApp) {
      try {
        const parsed = JSON.parse(sessionApp);
        const list = [parsed];
        localStorage.setItem(storageKey, JSON.stringify(list));
        return list;
      } catch (e) {
        console.warn("Error reading session application:", e);
      }
    }

    return [];
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
          <td class="py-4 px-6 font-mono text-[14px] text-ink font-medium whitespace-nowrap">
            ${appId}
          </td>
          <td class="py-4 px-6 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium ${statusClass}">
              <span class="w-1.5 h-1.5 rounded-full ${statusText === 'Approved' ? 'bg-emerald-600' : (statusText === 'Pre-Approved' ? 'bg-blue-600' : 'bg-amber-500')}"></span>
              ${statusText}
            </span>
          </td>
          <td class="py-4 px-6 font-mono text-[13px] text-slateMuted whitespace-nowrap">
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

    const modalAppId = document.getElementById('modalAppId');
    const modalProduct = document.getElementById('modalProduct');
    const modalAmount = document.getElementById('modalAmount');
    const modalScore = document.getElementById('modalScore');
    const modalRisk = document.getElementById('modalRisk');
    const modalStatus = document.getElementById('modalStatus');

    const appId = app.application_id || 'CRD-2026-001';
    const amount = app.requested_amount || (app.financial_details ? app.financial_details.loan_amount : 500000);
    const product = app.loan_type || 'Personal Loan';
    const ml = app.ml_pre_screening || { outcome: 'PRE_APPROVED', confidence_score: 0.884, risk_band: 'LOW' };

    if (modalAppId) modalAppId.textContent = appId;
    if (modalProduct) modalProduct.textContent = product;
    if (modalAmount) modalAmount.textContent = this.formatINR(amount);
    if (modalScore) modalScore.textContent = `${Math.round((ml.confidence_score || 0.85) * 100)}%`;
    if (modalRisk) modalRisk.textContent = `${ml.risk_band || 'LOW'} RISK`;
    if (modalStatus) modalStatus.textContent = ml.outcome === 'PRE_APPROVED' ? 'Pre-Approved' : 'Officer Review Pending';

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
