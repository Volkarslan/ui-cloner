// React-Cloner Side Panel
// UI controls, JSON display, copy/download

const MSG = {
  START_FULL_SCAN: 'START_FULL_SCAN',
  START_ELEMENT_SELECT: 'START_ELEMENT_SELECT',
  CANCEL_OPERATION: 'CANCEL_OPERATION',
  SCAN_PROGRESS: 'SCAN_PROGRESS',
  SCAN_COMPLETE: 'SCAN_COMPLETE',
  ELEMENT_SELECTED: 'ELEMENT_SELECTED',
  SCAN_ERROR: 'SCAN_ERROR',
};

// DOM Elements
const btnScan = document.getElementById('btn-scan');
const btnSelect = document.getElementById('btn-select');
const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const statusMessage = document.getElementById('status-message');
const outputCode = document.getElementById('output-code');

const optPlaceholders = document.getElementById('opt-placeholders');
const optAutoScroll = document.getElementById('opt-auto-scroll');

let isScanning = false;
let currentData = null;

// --- Event Listeners ---

btnScan.addEventListener('click', () => {
  if (isScanning) {
    cancelScan();
  } else {
    startFullScan();
  }
});

btnSelect.addEventListener('click', () => {
  startElementSelect();
});

btnCopy.addEventListener('click', () => {
  copyToClipboard();
});

btnDownload.addEventListener('click', () => {
  downloadJSON();
});

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case MSG.SCAN_PROGRESS:
      updateProgress(message.data);
      break;

    case MSG.SCAN_COMPLETE:
      handleScanComplete(message.data);
      break;

    case MSG.ELEMENT_SELECTED:
      handleScanComplete(message.data);
      break;

    case MSG.SCAN_ERROR:
      handleScanError(message.error);
      break;
  }
});

// --- Actions ---

function startFullScan() {
  isScanning = true;
  btnScan.textContent = 'Cancel';
  btnScan.classList.add('scanning');
  btnSelect.disabled = true;
  showProgress();
  hideStatus();
  clearOutput();

  const options = {
    usePlaceholders: optPlaceholders.checked,
    autoScroll: optAutoScroll.checked,
  };

  chrome.runtime.sendMessage(
    { type: MSG.START_FULL_SCAN, options },
    (response) => {
      if (chrome.runtime.lastError || (response && response.error)) {
        const err = chrome.runtime.lastError?.message || response?.error;
        handleScanError(err);
      }
    }
  );
}

function startElementSelect() {
  isScanning = true;
  btnScan.disabled = true;
  btnSelect.textContent = 'Cancel';
  btnSelect.classList.add('scanning');
  showProgress();
  hideStatus();
  clearOutput();

  chrome.runtime.sendMessage(
    { type: MSG.START_ELEMENT_SELECT, options: {} },
    (response) => {
      if (chrome.runtime.lastError || (response && response.error)) {
        const err = chrome.runtime.lastError?.message || response?.error;
        handleScanError(err);
      }
    }
  );
}

function cancelScan() {
  chrome.runtime.sendMessage({ type: MSG.CANCEL_OPERATION });
  resetUI();
  showStatus('Operation cancelled.', 'info');
}

// --- UI Updates ---

function updateProgress(data) {
  progressContainer.classList.remove('hidden');
  progressFill.style.width = Math.min(data.percent, 100) + '%';
  progressText.textContent = data.message || `${data.phase}... ${Math.round(data.percent)}%`;
}

function handleScanComplete(data) {
  currentData = data;
  isScanning = false;
  resetUI();
  hideProgress();

  // Count elements
  const count = countAllNodes(data);
  const sectionInfo = data.sectionCount ? ` in ${data.sectionCount} sections` : '';
  showStatus(`Extraction complete! ${count} elements found${sectionInfo}.`, 'success');

  // Render JSON
  renderJSON(data);

  // Enable action buttons
  btnCopy.disabled = false;
  btnDownload.disabled = false;
}

function handleScanError(error) {
  isScanning = false;
  resetUI();
  hideProgress();
  showStatus(`Error: ${error}`, 'error');
}

function resetUI() {
  isScanning = false;

  btnScan.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 1h4v4H1V1zm10 0h4v4h-4V1zM1 11h4v4H1v-4zm10 0h4v4h-4v-4zM6 3h4v2H6V3zM3 6h2v4H3V6zm8 0h2v4h-2V6zM6 11h4v2H6v-2z" fill="currentColor"/>
    </svg>
    Scan Page
  `;
  btnScan.classList.remove('scanning');
  btnScan.disabled = false;

  btnSelect.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2v4H0V0h6v2H2zm12 0h-4V0h6v6h-2V2zM2 14v-4H0v6h6v-2H2zm12 0h-4v2h6v-6h-2v4zM4 4h8v8H4V4z" fill="currentColor"/>
    </svg>
    Select Element
  `;
  btnSelect.classList.remove('scanning');
  btnSelect.disabled = false;
}

function showProgress() {
  progressContainer.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = 'Starting...';
}

function hideProgress() {
  progressContainer.classList.add('hidden');
}

function showStatus(text, type = 'info') {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

function hideStatus() {
  statusMessage.className = 'status-message hidden';
}

function clearOutput() {
  outputCode.textContent = 'Processing...';
  currentData = null;
  btnCopy.disabled = true;
  btnDownload.disabled = true;
}

// --- JSON Rendering ---

function renderJSON(data) {
  const json = JSON.stringify(data, null, 2);
  outputCode.innerHTML = syntaxHighlight(json);
}

function syntaxHighlight(json) {
  // Escape HTML first
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// --- Clipboard & Download ---

async function copyToClipboard() {
  if (!currentData) return;

  try {
    const json = JSON.stringify(currentData, null, 2);
    await navigator.clipboard.writeText(json);
    const originalText = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => {
      btnCopy.textContent = originalText;
    }, 1500);
  } catch (err) {
    showStatus('Failed to copy to clipboard.', 'error');
  }
}

function downloadJSON() {
  if (!currentData) return;

  const json = JSON.stringify(currentData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

  const a = document.createElement('a');
  a.href = url;
  a.download = `react-cloner-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Helpers ---

function countAllNodes(data) {
  if (!data) return 0;

  // Handle sectioned output
  if (data.sections) {
    let total = 0;
    for (const section of data.sections) {
      total += countNodes(section);
    }
    return total;
  }

  // Handle single tree output (element select mode)
  if (data.tree) {
    return countNodes(data.tree);
  }

  return countNodes(data);
}

function countNodes(node) {
  if (!node) return 0;
  let count = 1;

  // If this is a repeated element, count the repetitions
  if (node.repeated) {
    count = node.repeated.count;
  }

  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}
