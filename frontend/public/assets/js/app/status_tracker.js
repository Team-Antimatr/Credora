// Credora Application Status & 24h Correction Window Tracker

export function initStatusTracker() {
  const appDataRaw = sessionStorage.getItem('credora_active_application');
  let appData = null;
  if (appDataRaw) {
    try {
      appData = JSON.parse(appDataRaw);
    } catch(e) {}
  }

  // Update Dynamic IDs if present on page
  const appIdEl = document.querySelector('h1');
  if (appIdEl && appData?.application_id) {
    appIdEl.innerText = `Application ${appData.application_id}`;
  }

  // Correction Window Countdown (24 Hours from submission)
  const timerContainer = document.getElementById('correctionTimer');
  if (timerContainer) {
    const submissionTime = appData?.submitted_at ? new Date(appData.submitted_at).getTime() : Date.now();
    const expiryTime = submissionTime + (24 * 60 * 60 * 1000);

    function updateCountdown() {
      const remaining = expiryTime - Date.now();
      if (remaining <= 0) {
        timerContainer.innerText = "Correction window closed";
        const editBtn = document.getElementById('editAppBtn');
        if (editBtn) editBtn.style.display = 'none';
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      timerContainer.innerText = `${hours}h ${minutes}m remaining`;
    }

    updateCountdown();
    setInterval(updateCountdown, 60000);
  }
}

document.addEventListener('DOMContentLoaded', initStatusTracker);
