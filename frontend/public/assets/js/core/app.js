// Credora UI State & Loading Management Module

let activeLoadingRequests = 0;
let topLoaderElement = null;
let topLoaderAnimationTimer = null;

// Ensure loader CSS styles are dynamically injected
function ensureLoaderStyles() {
  if (document.getElementById('credora-loader-styles')) return;

  const style = document.createElement('style');
  style.id = 'credora-loader-styles';
  style.textContent = `
    /* Credora Top Progress Bar */
    #credora-top-loader {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 2.5px;
      background: #0A0A0A;
      z-index: 999999;
      opacity: 0;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      pointer-events: none;
      box-shadow: 0 0 8px rgba(10, 10, 10, 0.35);
    }

    #credora-top-loader.active {
      opacity: 1;
    }

    /* Minimal Bouncing Dots Spinner (Monochrome / CurrentColor) */
    .credora-loader-dots {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 1em;
      vertical-align: middle;
      margin-right: 6px;
    }

    .credora-loader-dots .dot {
      width: 4.5px;
      height: 4.5px;
      border-radius: 50%;
      background-color: currentColor;
      display: inline-block;
      animation: credora-bouncing-dots 0.9s infinite ease-in-out both;
    }

    .credora-loader-dots .dot:nth-child(1) {
      animation-delay: -0.3s;
    }
    .credora-loader-dots .dot:nth-child(2) {
      animation-delay: -0.15s;
    }
    .credora-loader-dots .dot:nth-child(3) {
      animation-delay: 0s;
    }

    @keyframes credora-bouncing-dots {
      0%, 80%, 100% {
        transform: scale(0.35);
        opacity: 0.3;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Processing button state */
    button[aria-busy="true"],
    a[aria-busy="true"] {
      pointer-events: none;
      cursor: not-allowed;
      opacity: 0.82;
    }
  `;
  document.head.appendChild(style);
}

// Get or create top loader bar element
function getTopLoader() {
  if (!topLoaderElement) {
    topLoaderElement = document.getElementById('credora-top-loader');
    if (!topLoaderElement && document.body) {
      topLoaderElement = document.createElement('div');
      topLoaderElement.id = 'credora-top-loader';
      document.body.appendChild(topLoaderElement);
    }
  }
  return topLoaderElement;
}

/**
 * Generate minimal bouncing dots HTML
 */
export function getBouncingDotsHtml() {
  return `<span class="credora-loader-dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
}

/**
 * Display a top loading progress bar across page transitions or active requests
 */
export function showLoader() {
  ensureLoaderStyles();
  activeLoadingRequests++;

  const loader = getTopLoader();
  if (!loader) return;

  loader.classList.add('active');
  document.body.setAttribute('aria-busy', 'true');

  if (activeLoadingRequests === 1) {
    loader.style.width = '30%';
    clearInterval(topLoaderAnimationTimer);
    topLoaderAnimationTimer = setInterval(() => {
      const currentWidth = parseFloat(loader.style.width) || 30;
      if (currentWidth < 85) {
        loader.style.width = `${currentWidth + 12}%`;
      }
    }, 250);
  }
}

/**
 * Hide or resolve the top loading progress bar
 */
export function hideLoader() {
  activeLoadingRequests = Math.max(0, activeLoadingRequests - 1);

  if (activeLoadingRequests === 0) {
    clearInterval(topLoaderAnimationTimer);
    const loader = getTopLoader();
    if (!loader) return;

    loader.style.width = '100%';
    document.body.removeAttribute('aria-busy');

    setTimeout(() => {
      if (activeLoadingRequests === 0) {
        loader.classList.remove('active');
        setTimeout(() => {
          if (activeLoadingRequests === 0) {
            loader.style.width = '0%';
          }
        }, 200);
      }
    }, 200);
  }
}

/**
 * Set an action button into a processing/disabled state with contextual spinner
 * @param {HTMLButtonElement|HTMLElement} button - Target button
 * @param {boolean} isLoading - Active state
 * @param {string} loadingText - Contextual text (e.g. "Running ML Pre-Screening...")
 */
export function setButtonLoading(button, isLoading, loadingText = "Processing...") {
  if (!button) return;
  ensureLoaderStyles();

  if (isLoading) {
    // Preserve original content if not already saved
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `${getBouncingDotsHtml()}<span>${loadingText}</span>`;
  } else {
    // Restore original state
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

// Initialize styles on DOM readiness
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureLoaderStyles);
  } else {
    ensureLoaderStyles();
  }
}

// Global exposure for non-module scripts
if (typeof window !== 'undefined') {
  window.CredoraLoader = {
    showLoader,
    hideLoader,
    setButtonLoading,
    getBouncingDotsHtml
  };
}
