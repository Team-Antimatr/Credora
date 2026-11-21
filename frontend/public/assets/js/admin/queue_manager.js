// Credora Loan Officer Review Queue Manager
import { setButtonLoading, showLoader, hideLoader } from "../core/app.js";

export function initQueueManager() {
  const searchInput = document.getElementById('search-input');
  const regionSelect = document.querySelector('select');

  // Search filter handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const cards = document.querySelectorAll('.queue-item-card');
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // Bind Approve / Reject buttons
  document.querySelectorAll('button').forEach(btn => {
    const text = btn.innerText.trim();
    if (text === 'Approve' || text === 'Verify & Approve') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const confirmed = confirm("Confirm Sanction & Approval for this loan application?");
        if (confirmed) {
          setButtonLoading(btn, true, "Saving Decision...");
          showLoader();
          setTimeout(() => {
            hideLoader();
            btn.removeAttribute('aria-busy');
            btn.innerHTML = "Approved ✓";
            btn.className = "bg-emerald-600 text-white text-xs px-3 py-1.5 rounded";
            btn.disabled = true;
          }, 450);
        }
      });
    } else if (text === 'Reject' || text === 'Decline') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const reason = prompt("Enter mandatory regulatory rationale for loan rejection:");
        if (reason) {
          setButtonLoading(btn, true, "Saving Decision...");
          showLoader();
          setTimeout(() => {
            hideLoader();
            btn.removeAttribute('aria-busy');
            btn.innerHTML = "Rejected ✗";
            btn.className = "bg-rose-600 text-white text-xs px-3 py-1.5 rounded";
            btn.disabled = true;
          }, 450);
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', initQueueManager);
