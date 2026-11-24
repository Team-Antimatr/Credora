// Credora Admin Portal & Underwriting Console Manager
// Handles 4-tab workflow: Pending, Approved, Total Users, Statistics
// Synchronizes real-time application states between admin and borrower dashboards.

import { AuthState } from "../core/auth.js";

const ALL_APPLICATIONS_KEY = "credora_all_applications";
const AUDIT_ACTIVITY_KEY = "credora_audit_activity";

export class AdminPortalManager {
  constructor() {
    this.officerName = localStorage.getItem('credora_officer_name') || "Anita Deshmukh (Central Desk)";
    this.currentTab = "pending";
    this.applications = [];
    this.activities = [];

    this.checkOfficerAuth();
    this.initData();
    this.bindEvents();
    this.render();
  }

  checkOfficerAuth() {
    const role = localStorage.getItem('credora_user_role');
    if (role !== 'officer' && role !== 'admin') {
      window.location.replace('admin-login.html');
    }
    const nameEl = document.getElementById('officerNameDisplay');
    if (nameEl) nameEl.textContent = this.officerName;
  }

  // ----------------------------------------------------
  // DATA INGESTION & SEEDING
  // ----------------------------------------------------
  initData() {
    try {
      const storedApps = localStorage.getItem(ALL_APPLICATIONS_KEY);
      if (storedApps) {
        this.applications = JSON.parse(storedApps);
      } else {
        this.applications = this.getSeedApplications();
        this.saveApplications();
      }

      const storedActs = localStorage.getItem(AUDIT_ACTIVITY_KEY);
      if (storedActs) {
        this.activities = JSON.parse(storedActs);
      } else {
        this.activities = this.getSeedActivities();
        this.saveActivities();
      }
    } catch (e) {
      console.warn("Error initializing admin portal data:", e);
      this.applications = this.getSeedApplications();
      this.activities = this.getSeedActivities();
    }
  }

  getSeedApplications() {
    const now = new Date();
    return [
      {
        application_id: "CRD-2026-0891",
        tracking_number: "TRK-849102",
        status: "Pending",
        full_name: "Rahul Mehta",
        applicant_email: "rahul.mehta@example.com",
        user_key: "rahul_mehta_example_com",
        age: 34,
        credit_score: 785,
        income: 95000,
        coapplicant_income: 30000,
        loan_amount: 750000,
        loan_tenure: 48,
        loan_type: "Personal Loan",
        gender: "Male",
        marital_status: "Married",
        dependents: "2",
        education: "Graduate",
        employment: "Salaried Professional",
        property_area: "Urban",
        submitted_at: new Date(now.getTime() - 25 * 60000).toISOString(),
        issue_date: "24 Nov 2026",
        ml_pre_screening: {
          outcome: "PRE_APPROVED",
          prediction_code: "APPROVE",
          confidence_score: 0.892,
          risk_band: "LOW",
          primary_driver: "High Credit Score (785) & Stable DTI"
        },
        human_verification: {
          verified: false,
          verified_by: null,
          verified_at: null
        }
      },
      {
        application_id: "CRD-2026-0892",
        tracking_number: "TRK-610283",
        status: "Pending",
        full_name: "Vikram Singhania",
        applicant_email: "vikram.s@example.com",
        user_key: "vikram_s_example_com",
        age: 41,
        credit_score: 590,
        income: 38000,
        coapplicant_income: 0,
        loan_amount: 1200000,
        loan_tenure: 36,
        loan_type: "Personal Loan",
        gender: "Male",
        marital_status: "Married",
        dependents: "3+",
        education: "Non-Graduate",
        employment: "Self-Employed",
        property_area: "Rural",
        submitted_at: new Date(now.getTime() - 48 * 60000).toISOString(),
        issue_date: "24 Nov 2026",
        ml_pre_screening: {
          outcome: "REJECTED",
          prediction_code: "DENIED",
          confidence_score: 0.184,
          risk_band: "HIGH",
          primary_driver: "Sub-600 CIBIL & Over-leveraged DTI ratio"
        },
        human_verification: {
          verified: false,
          verified_by: null,
          verified_at: null
        }
      },
      {
        application_id: "CRD-2026-0893",
        tracking_number: "TRK-493820",
        status: "Pending",
        full_name: "Ananya Deshpande",
        applicant_email: "ananya.d@example.com",
        user_key: "ananya_d_example_com",
        age: 27,
        credit_score: 665,
        income: 52000,
        coapplicant_income: 15000,
        loan_amount: 450000,
        loan_tenure: 24,
        loan_type: "Personal Loan",
        gender: "Female",
        marital_status: "Single",
        dependents: "0",
        education: "Post-Graduate",
        employment: "Contract Specialist",
        property_area: "Semiurban",
        submitted_at: new Date(now.getTime() - 75 * 60000).toISOString(),
        issue_date: "24 Nov 2026",
        ml_pre_screening: {
          outcome: "EDGE_CASE_REVIEW",
          prediction_code: "HOLD",
          confidence_score: 0.528,
          risk_band: "MEDIUM",
          primary_driver: "Borderline Score (665) — Secondary Income Verification Needed"
        },
        human_verification: {
          verified: false,
          verified_by: null,
          verified_at: null
        }
      },
      {
        application_id: "CRD-2026-0888",
        tracking_number: "TRK-902381",
        status: "Approved",
        full_name: "Pooja Hegde",
        applicant_email: "pooja.hegde@example.com",
        user_key: "pooja_hegde_example_com",
        age: 30,
        credit_score: 820,
        income: 120000,
        coapplicant_income: 60000,
        loan_amount: 3500000,
        loan_tenure: 180,
        loan_type: "Home Loan",
        gender: "Female",
        marital_status: "Married",
        dependents: "1",
        education: "Post-Graduate",
        employment: "Salaried Professional",
        property_area: "Urban",
        submitted_at: new Date(now.getTime() - 180 * 60000).toISOString(),
        issue_date: "24 Nov 2026",
        ml_pre_screening: {
          outcome: "PRE_APPROVED",
          prediction_code: "APPROVE",
          confidence_score: 0.942,
          risk_band: "LOW",
          primary_driver: "Exceptional CIBIL (820) & Dual Income Stream"
        },
        human_verification: {
          verified: false, // Pre-approval mode awaiting human verification
          verified_by: null,
          verified_at: null
        }
      },
      {
        application_id: "CRD-2026-0880",
        tracking_number: "TRK-102938",
        status: "Approved",
        full_name: "Amitabh Banerjee",
        applicant_email: "amitabh.b@example.com",
        user_key: "amitabh_b_example_com",
        age: 46,
        credit_score: 790,
        income: 180000,
        coapplicant_income: 0,
        loan_amount: 5000000,
        loan_tenure: 240,
        loan_type: "Home Loan",
        gender: "Male",
        marital_status: "Married",
        dependents: "2",
        education: "Graduate",
        employment: "Salaried Professional",
        property_area: "Semiurban",
        submitted_at: new Date(now.getTime() - 360 * 60000).toISOString(),
        issue_date: "23 Nov 2026",
        ml_pre_screening: {
          outcome: "PRE_APPROVED",
          prediction_code: "APPROVE",
          confidence_score: 0.915,
          risk_band: "LOW",
          primary_driver: "High Net Worth & Corporate Employment"
        },
        human_verification: {
          verified: true,
          verified_by: "Anita Deshmukh",
          verified_at: new Date(now.getTime() - 300 * 60000).toISOString()
        }
      }
    ];
  }

  getSeedActivities() {
    const now = new Date();
    return [
      {
        timestamp: new Date(now.getTime() - 25 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: "Applicant",
        action: "Form Submission",
        applicant: "Rahul Mehta",
        application_id: "CRD-2026-0891",
        details: "Applied for ₹7,50,000 Personal Loan. Documents attached."
      },
      {
        timestamp: new Date(now.getTime() - 24 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: "ML Model Baseline",
        action: "Pre-Screening",
        applicant: "Rahul Mehta",
        application_id: "CRD-2026-0891",
        details: "Evaluated PRE_APPROVED (Score 89.2%, Low Risk Band)."
      },
      {
        timestamp: new Date(now.getTime() - 48 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: "Applicant",
        action: "Form Submission",
        applicant: "Vikram Singhania",
        application_id: "CRD-2026-0892",
        details: "Applied for ₹12,00,000 Personal Loan."
      },
      {
        timestamp: new Date(now.getTime() - 47 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: "ML Model Baseline",
        action: "Pre-Screening",
        applicant: "Vikram Singhania",
        application_id: "CRD-2026-0892",
        details: "Evaluated DENIED (Score 18.4%, High Risk Band)."
      },
      {
        timestamp: new Date(now.getTime() - 300 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: "Anita Deshmukh",
        action: "Human Verification",
        applicant: "Amitabh Banerjee",
        application_id: "CRD-2026-0880",
        details: "Sanctioned ₹50,00,000 Home Loan after income certificate audit."
      }
    ];
  }

  saveApplications() {
    localStorage.setItem(ALL_APPLICATIONS_KEY, JSON.stringify(this.applications));
  }

  saveActivities() {
    localStorage.setItem(AUDIT_ACTIVITY_KEY, JSON.stringify(this.activities));
  }

  logActivity(actor, action, applicant, appId, details) {
    const act = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: actor,
      action: action,
      applicant: applicant,
      application_id: appId,
      details: details
    };
    this.activities.unshift(act);
    this.saveActivities();
  }

  // ----------------------------------------------------
  // EVENT BINDINGS
  // ----------------------------------------------------
  bindEvents() {
    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Refresh Feed
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.initData();
        this.render();
        const syncLabel = document.getElementById('lastSyncTimestamp');
        if (syncLabel) syncLabel.textContent = `Last synced: ${new Date().toLocaleTimeString()}`;
      });
    }

    // Search input for pending applications
    const searchInput = document.getElementById('pendingSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#pendingTableBody tr');
        rows.forEach(r => {
          const text = r.innerText.toLowerCase();
          r.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    // Modal Close buttons
    const closeBtn = document.getElementById('closePreviewModalBtn');
    const closeFooterBtn = document.getElementById('closePreviewModalFooterBtn');
    const modal = document.getElementById('appPreviewModal');

    if (closeBtn) closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', () => modal?.classList.add('hidden'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    // Sign Out
    const signOutBtn = document.getElementById('adminSignOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        localStorage.removeItem('credora_user_role');
        window.location.replace('admin-login.html');
      });
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update Tab Buttons UI
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      if (isTarget) {
        btn.classList.add('border-white', 'text-white');
        btn.classList.remove('border-transparent', 'text-zinc-400');
      } else {
        btn.classList.remove('border-white', 'text-white');
        btn.classList.add('border-transparent', 'text-zinc-400');
      }
    });

    // Show / Hide Content Sections
    document.querySelectorAll('.admin-tab-content').forEach(sec => {
      sec.classList.add('hidden');
    });

    const targetSection = document.getElementById(`tabContent-${tabName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    this.render();
  }

  // ----------------------------------------------------
  // RENDER PIPELINE
  // ----------------------------------------------------
  render() {
    this.updateCounters();
    this.renderPendingTable();
    this.renderApprovedTable();
    this.renderUsersTab();
  }

  formatINR(num) {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  }

  updateCounters() {
    const pendingApps = this.applications.filter(a => a.status === 'Pending' || a.status === 'Under Review');
    const approvedApps = this.applications.filter(a => a.status === 'Approved');
    const deniedApps = this.applications.filter(a => a.status === 'Denied' || a.status === 'Rejected');
    const holdApps = this.applications.filter(a => a.status === 'Hold' || a.status === 'On Hold');

    const badgePending = document.getElementById('badgePendingCount');
    const badgeApproved = document.getElementById('badgeApprovedCount');
    const badgeUsers = document.getElementById('badgeUsersCount');

    if (badgePending) badgePending.textContent = pendingApps.length;
    if (badgeApproved) badgeApproved.textContent = approvedApps.length;
    if (badgeUsers) badgeUsers.textContent = this.applications.length;

    const kpiTotal = document.getElementById('kpiTotalUsers');
    const kpiApproved = document.getElementById('kpiApprovedUsers');
    const kpiDenied = document.getElementById('kpiDeniedUsers');
    const kpiHold = document.getElementById('kpiHoldUsers');

    if (kpiTotal) kpiTotal.textContent = this.applications.length;
    if (kpiApproved) kpiApproved.textContent = approvedApps.length;
    if (kpiDenied) kpiDenied.textContent = deniedApps.length;
    if (kpiHold) kpiHold.textContent = holdApps.length;
  }

  // ----------------------------------------------------
  // TAB 1: PENDING APPLICATION TABLE
  // ----------------------------------------------------
  renderPendingTable() {
    const tbody = document.getElementById('pendingTableBody');
    const emptyState = document.getElementById('pendingEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';
    const pendingList = this.applications.filter(a => a.status === 'Pending' || a.status === 'Under Review');

    if (pendingList.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
    }

    pendingList.forEach(app => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-zinc-800/40 transition-colors border-b border-zinc-800 text-xs";

      // Prediction code & color indicators:
      // Approve -> Green #03a626
      // Denied -> Red #9c3c3c
      // Hold -> Yellow #fdae06
      const ml = app.ml_pre_screening || {};
      let predBadge = '';
      const predCode = ml.prediction_code || (ml.outcome === 'PRE_APPROVED' ? 'APPROVE' : (ml.outcome === 'REJECTED' ? 'DENIED' : 'HOLD'));

      if (predCode === 'APPROVE') {
        predBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#03a626]/20 border border-[#03a626]/40 text-[#03a626] font-semibold font-mono">
            <span class="w-2 h-2 rounded-full bg-[#03a626]"></span>
            Approve (${Math.round((ml.confidence_score || 0.88) * 100)}%)
          </span>
        `;
      } else if (predCode === 'DENIED') {
        predBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#9c3c3c]/20 border border-[#9c3c3c]/40 text-[#f87171] font-semibold font-mono">
            <span class="w-2 h-2 rounded-full bg-[#9c3c3c]"></span>
            Denied (${Math.round((ml.confidence_score || 0.20) * 100)}%)
          </span>
        `;
      } else {
        predBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fdae06]/20 border border-[#fdae06]/40 text-[#fdae06] font-semibold font-mono">
            <span class="w-2 h-2 rounded-full bg-[#fdae06]"></span>
            Hold (${Math.round((ml.confidence_score || 0.50) * 100)}%)
          </span>
        `;
      }

      const creditScoreVal = app.credit_score || (app.financial_details ? (app.financial_details.credit_history >= 1.0 ? 750 : 580) : 720);
      const ageVal = app.age || 32;
      const incomeVal = app.income || (app.financial_details ? app.financial_details.applicant_income : 50000);
      const loanAmountVal = app.loan_amount || app.requested_amount || (app.financial_details ? app.financial_details.loan_amount : 500000);

      tr.innerHTML = `
        <td class="py-4 px-4 font-medium text-white whitespace-nowrap">
          <div class="font-medium text-white">${app.full_name || 'Applicant'}</div>
          <div class="text-[10px] text-zinc-500 font-mono">${app.application_id || 'CRD-0000'}</div>
        </td>
        <td class="py-4 px-3 font-mono font-medium whitespace-nowrap ${creditScoreVal >= 700 ? 'text-[#03a626]' : (creditScoreVal >= 650 ? 'text-[#fdae06]' : 'text-[#9c3c3c]')}">
          ${creditScoreVal}
        </td>
        <td class="py-4 px-3 font-mono text-zinc-300 whitespace-nowrap">
          ${ageVal}
        </td>
        <td class="py-4 px-3 font-mono text-zinc-300 whitespace-nowrap">
          ${this.formatINR(incomeVal)}
        </td>
        <td class="py-4 px-3 font-mono text-white font-medium whitespace-nowrap">
          ${this.formatINR(loanAmountVal)}
        </td>
        <td class="py-4 px-3 whitespace-nowrap">
          <button 
            type="button" 
            class="view-preview-btn text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
            data-appid="${app.application_id}">
            View Preview →
          </button>
        </td>
        <td class="py-4 px-4 whitespace-nowrap">
          ${predBadge}
        </td>
        <td class="py-4 px-3 text-center whitespace-nowrap">
          <button 
            type="button" 
            class="action-approve-btn bg-[#03a626] hover:bg-[#028a20] text-white px-3 py-1.5 rounded font-medium text-xs transition-colors"
            data-appid="${app.application_id}">
            Approve
          </button>
        </td>
        <td class="py-4 px-3 text-center whitespace-nowrap">
          <button 
            type="button" 
            class="action-deny-btn bg-[#9c3c3c] hover:bg-[#853232] text-white px-3 py-1.5 rounded font-medium text-xs transition-colors"
            data-appid="${app.application_id}">
            Denied
          </button>
        </td>
        <td class="py-4 px-3 text-center whitespace-nowrap">
          <button 
            type="button" 
            class="action-hold-btn bg-[#fdae06] hover:bg-[#e09a04] text-black px-3 py-1.5 rounded font-medium text-xs transition-colors"
            data-appid="${app.application_id}">
            Hold
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Wire row buttons
    tbody.querySelectorAll('.view-preview-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        const target = this.applications.find(a => a.application_id === appId);
        if (target) this.openPreviewModal(target);
      });
    });

    tbody.querySelectorAll('.action-approve-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        this.handleOfficerDecision(appId, 'Approved');
      });
    });

    tbody.querySelectorAll('.action-deny-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        this.handleOfficerDecision(appId, 'Denied');
      });
    });

    tbody.querySelectorAll('.action-hold-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        this.handleOfficerDecision(appId, 'Hold');
      });
    });
  }

  // ----------------------------------------------------
  // DECISION HANDLER (Approve, Deny, Hold)
  // ----------------------------------------------------
  handleOfficerDecision(appId, decision) {
    const app = this.applications.find(a => a.application_id === appId);
    if (!app) return;

    const previousStatus = app.status;
    app.status = decision;

    if (decision === 'Approved') {
      app.human_verification = {
        verified: true,
        verified_by: this.officerName,
        verified_at: new Date().toISOString()
      };
      app.reason = "Approved and Sanctioned by Credit Officer";
    } else if (decision === 'Denied') {
      app.reason = "Application Denied by Underwriting Desk";
    } else if (decision === 'Hold') {
      app.reason = "Put On Hold for Supplementary Income Verification";
    }

    this.saveApplications();

    // Synchronize to the user's personal application storage
    if (app.user_key) {
      try {
        const userStorageKey = `credora_applications_${app.user_key}`;
        const userAppsRaw = localStorage.getItem(userStorageKey);
        let userApps = userAppsRaw ? JSON.parse(userAppsRaw) : [];
        const userIdx = userApps.findIndex(a => a.application_id === appId);
        if (userIdx !== -1) {
          userApps[userIdx].status = decision;
          userApps[userIdx].reason = app.reason;
          userApps[userIdx].human_verification = app.human_verification;
          localStorage.setItem(userStorageKey, JSON.stringify(userApps));
        }
      } catch (err) {
        console.warn("Failed synchronizing decision to user storage:", err);
      }
    }

    // Log Activity
    this.logActivity(
      this.officerName,
      `Decision: ${decision}`,
      app.full_name,
      app.application_id,
      `Status changed from ${previousStatus} to ${decision}.`
    );

    this.render();
  }

  // ----------------------------------------------------
  // TAB 2: APPROVED APPLICATION TABLE
  // ----------------------------------------------------
  renderApprovedTable() {
    const tbody = document.getElementById('approvedTableBody');
    const emptyState = document.getElementById('approvedEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';
    const approvedList = this.applications.filter(a => a.status === 'Approved');

    if (approvedList.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
    }

    approvedList.forEach(app => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-zinc-800/40 transition-colors border-b border-zinc-800 text-xs";

      const isHumanVerified = app.human_verification && app.human_verification.verified;
      const creditScoreVal = app.credit_score || 750;
      const loanAmountVal = app.loan_amount || app.requested_amount || 500000;
      const sanctionDate = app.human_verification?.verified_at 
        ? new Date(app.human_verification.verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : (app.issue_date || '24 Nov 2026');

      let statusBadge = '';
      let actionColumn = '';

      if (isHumanVerified) {
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#03a626]/20 border border-[#03a626]/40 text-[#03a626] font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-[#03a626]"></span>
            Human Verified & Sanctioned
          </span>
        `;
        actionColumn = `
          <span class="text-[11px] text-zinc-500 font-mono">
            ✓ ${app.human_verification.verified_by || 'Officer Verified'}
          </span>
        `;
      } else {
        // Pre-approval mode awaiting human verification
        statusBadge = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Model Pre-Approved (Pre-Approval Mode)
          </span>
        `;
        actionColumn = `
          <button 
            type="button" 
            class="verify-now-btn bg-white hover:bg-zinc-200 text-black px-3 py-1 rounded font-semibold text-xs transition-colors"
            data-appid="${app.application_id}">
            Human Verify & Sanction →
          </button>
        `;
      }

      tr.innerHTML = `
        <td class="py-4 px-4 font-medium text-white whitespace-nowrap">
          ${app.full_name || 'Applicant'}
        </td>
        <td class="py-4 px-3 font-mono text-zinc-400 whitespace-nowrap">
          ${app.application_id || 'CRD-0000'}
        </td>
        <td class="py-4 px-3 font-mono font-medium text-[#03a626] whitespace-nowrap">
          ${creditScoreVal}
        </td>
        <td class="py-4 px-3 font-mono text-white font-medium whitespace-nowrap">
          ${this.formatINR(loanAmountVal)}
        </td>
        <td class="py-4 px-4 whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="py-4 px-3 font-mono text-zinc-400 whitespace-nowrap">
          ${sanctionDate}
        </td>
        <td class="py-4 px-3 whitespace-nowrap">
          <button 
            type="button" 
            class="view-preview-btn text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
            data-appid="${app.application_id}">
            View Record →
          </button>
        </td>
        <td class="py-4 px-4 text-right whitespace-nowrap">
          ${actionColumn}
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.view-preview-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        const target = this.applications.find(a => a.application_id === appId);
        if (target) this.openPreviewModal(target);
      });
    });

    tbody.querySelectorAll('.verify-now-btn').forEach(b => {
      b.addEventListener('click', () => {
        const appId = b.getAttribute('data-appid');
        this.handleOfficerDecision(appId, 'Approved');
      });
    });
  }

  // ----------------------------------------------------
  // TAB 3: TOTAL USERS & AUDIT STREAM
  // ----------------------------------------------------
  renderUsersTab() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.activities.forEach(act => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/60";

      let actorBadge = '';
      if (act.actor === 'Applicant') {
        actorBadge = `<span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px]">USER</span>`;
      } else if (act.actor === 'ML Model Baseline') {
        actorBadge = `<span class="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px]">ML ENGINE</span>`;
      } else {
        actorBadge = `<span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-mono text-[10px]">ADMIN / OFFICER</span>`;
      }

      tr.innerHTML = `
        <td class="py-2.5 px-4 font-mono text-zinc-400 whitespace-nowrap">${act.timestamp}</td>
        <td class="py-2.5 px-3 whitespace-nowrap">${actorBadge}</td>
        <td class="py-2.5 px-3 font-medium text-white whitespace-nowrap">${act.action}</td>
        <td class="py-2.5 px-4 text-zinc-200 whitespace-nowrap">${act.applicant}</td>
        <td class="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">${act.application_id}</td>
        <td class="py-2.5 px-4 text-zinc-400 max-w-sm truncate">${act.details}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  // ----------------------------------------------------
  // IMMUTABLE READ-ONLY PREVIEW MODAL
  // ----------------------------------------------------
  openPreviewModal(app) {
    const modal = document.getElementById('appPreviewModal');
    if (!modal) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('previewAppId', app.application_id || 'CRD-2026-0000');
    setVal('previewApplicantName', app.full_name || 'Borrower');
    setVal('previewTimestamp', app.submitted_at ? new Date(app.submitted_at).toLocaleString() : '2026-11-24 12:00:00');

    setVal('previewAge', `${app.age || 32} Years`);
    setVal('previewGender', app.gender || 'Male');
    setVal('previewMarital', app.marital_status || 'Married');
    setVal('previewDependents', app.dependents || '2');
    setVal('previewEducation', app.education || 'Graduate');
    setVal('previewEmployment', app.employment || 'Salaried Professional');

    setVal('previewProduct', app.loan_type || 'Personal Loan');
    setVal('previewAmount', this.formatINR(app.loan_amount || app.requested_amount || 500000));
    setVal('previewTenure', `${app.loan_tenure || 36} Months`);
    setVal('previewCreditScore', `${app.credit_score || 750}`);
    setVal('previewIncome', `${this.formatINR(app.income || 50000)} / mo`);
    setVal('previewProperty', app.property_area || 'Urban');

    const ml = app.ml_pre_screening || {};
    const outcomeEl = document.getElementById('previewMlOutcome');
    const outcome = ml.outcome || 'PRE_APPROVED';

    if (outcomeEl) {
      outcomeEl.textContent = outcome;
      if (outcome === 'PRE_APPROVED') {
        outcomeEl.className = "text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#03a626]/20 text-[#03a626] border border-[#03a626]/40";
      } else if (outcome === 'REJECTED') {
        outcomeEl.className = "text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#9c3c3c]/20 text-[#f87171] border border-[#9c3c3c]/40";
      } else {
        outcomeEl.className = "text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#fdae06]/20 text-[#fdae06] border border-[#fdae06]/40";
      }
    }

    setVal('previewConfidence', `${Math.round((ml.confidence_score || 0.88) * 100)}%`);
    setVal('previewRiskBand', `${ml.risk_band || 'LOW'} RISK`);

    const statusBadgeContainer = document.getElementById('previewStatusBadge');
    if (statusBadgeContainer) {
      const isApproved = app.status === 'Approved';
      const isDenied = app.status === 'Denied' || app.status === 'Rejected';
      const isHold = app.status === 'Hold' || app.status === 'On Hold';

      if (isApproved) {
        statusBadgeContainer.innerHTML = `<span class="bg-[#03a626]/20 border border-[#03a626]/40 text-[#03a626] text-xs px-2.5 py-0.5 rounded font-medium">Approved</span>`;
      } else if (isDenied) {
        statusBadgeContainer.innerHTML = `<span class="bg-[#9c3c3c]/20 border border-[#9c3c3c]/40 text-[#f87171] text-xs px-2.5 py-0.5 rounded font-medium">Denied</span>`;
      } else if (isHold) {
        statusBadgeContainer.innerHTML = `<span class="bg-[#fdae06]/20 border border-[#fdae06]/40 text-[#fdae06] text-xs px-2.5 py-0.5 rounded font-medium">On Hold</span>`;
      } else {
        statusBadgeContainer.innerHTML = `<span class="bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs px-2.5 py-0.5 rounded font-medium">Pending Review</span>`;
      }
    }

    modal.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AdminPortalManager();
});
