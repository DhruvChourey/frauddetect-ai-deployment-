// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Progress bar
function showProgress() {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.classList.add('active');
  }
}

function hideProgress() {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    setTimeout(() => progressBar.classList.remove('active'), 500);
  }
}

// Character counter
function updateCharCounter() {
  const content = document.getElementById('inputContent').value;
  const counter = document.getElementById('charCounter');
  if (counter) {
    counter.textContent = `${content.length} characters`;
  }
}

// Validate URL format
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Scan function with loading state and animations
async function scan() {
  const type = document.getElementById('scanType').value;
  const content = document.getElementById('inputContent').value.trim();
  const resultDiv = document.getElementById('result');
  const scanBtn = document.getElementById('scanBtn');
  
  resultDiv.textContent = '';
  resultDiv.classList.remove('show');

  // Validation
  if (!content) {
    showToast('Please paste some content first.', 'warning');
    return;
  }

  if (type === 'url' && !isValidURL(content)) {
    showToast('Please enter a valid URL.', 'error');
    return;
  }

  // Show loading state
  showProgress();
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<span class="spinner"></span> Scanning...';
  resultDiv.innerHTML = '<div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>';
  resultDiv.classList.add('show');

  let endpoint = '/api/scan-text';
  if (type === 'news') endpoint = '/api/scan-news';
  if (type === 'url') endpoint = '/api/scan-url';

  const body = type === 'url' ? { url: content } : { text: content };

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    
    if (!resp.ok) {
      throw new Error(data.error || 'Scan failed');
    }
    
    // Success feedback
    showToast('Scan completed successfully!', 'success');
    renderResult(data, resultDiv);
  } catch (e) {
    showToast(e.message || 'Request failed. Please try again.', 'error');
    resultDiv.innerHTML = `<div class="error-message"><span class="error-icon">⚠</span> ${e.message}</div>`;
    resultDiv.classList.add('show');
  } finally {
    hideProgress();
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan Now';
  }
}

function renderResult(record, container) {
  const riskClass = record.score <= 30 ? 'high-risk' : record.score <= 60 ? 'medium-risk' : 'low-risk';
  const riskIcon = record.score <= 30 ? '🚨' : record.score <= 60 ? '⚠️' : '✅';
  
  container.innerHTML = `
    <div class="result-header">
      <span class="risk-icon">${riskIcon}</span>
      <h3>Scan Results</h3>
    </div>
    <div class="result-grid">
      <div class="result-item">
        <span class="result-label">Verdict:</span>
        <span class="result-value">${record.verdict}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Risk Score:</span>
        <span class="badge ${riskClass}">${record.score}/100</span>
      </div>
      <div class="result-item">
        <span class="result-label">Type:</span>
        <span class="result-value">${record.type}</span>
      </div>
    </div>
    <div class="result-reason">
      <strong>Analysis:</strong>
      <p>${record.reason}</p>
    </div>
    ${record.suggestedSources && record.suggestedSources.length > 0 ? `
      <div class="suggested-sources">
        <strong>Suggested Sources:</strong>
        <ul>
          ${record.suggestedSources.map(source => `<li>${source}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div class="result-actions">
      <a href="/detailed.html?id=${record.id}" class="btn-secondary">View Full Details →</a>
      <button onclick="copyResultToClipboard()" class="btn-secondary">📋 Copy Report</button>
    </div>
  `;
  container.classList.add('show');
}

// Copy result to clipboard
function copyResultToClipboard() {
  const resultDiv = document.getElementById('result');
  const text = resultDiv.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Report copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// Clear form
function clearForm() {
  document.getElementById('inputContent').value = '';
  document.getElementById('result').innerHTML = '';
  document.getElementById('result').classList.remove('show');
  updateCharCounter();
  showToast('Form cleared', 'info');
}

// Event listeners
document.getElementById('scanBtn').addEventListener('click', scan);
document.getElementById('inputContent').addEventListener('input', updateCharCounter);
document.getElementById('scanType').addEventListener('change', () => {
  const type = document.getElementById('scanType').value;
  const textarea = document.getElementById('inputContent');
  if (type === 'url') {
    textarea.placeholder = 'https://example.com';
  } else if (type === 'news') {
    textarea.placeholder = 'Paste news article text here...';
  } else {
    textarea.placeholder = 'Paste suspicious message here...';
  }
});

// Allow Enter key to submit (Ctrl+Enter for multiline)
document.getElementById('inputContent').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    scan();
  }
});

// Initialize
updateCharCounter();
