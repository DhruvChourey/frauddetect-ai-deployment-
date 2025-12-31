// Toast notification
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

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Normalize verdict + score into consistent badge/icon colors
function getRiskMeta({ score, verdict }) {
  const verdictNormalized = (verdict || '').toLowerCase();

  if (verdictNormalized === 'safe') {
    return { riskClass: 'low-risk', riskIcon: '✅' };
  }

  if (['suspicious', 'scam', 'fraud', 'phishing', 'danger'].includes(verdictNormalized)) {
    return { riskClass: 'high-risk', riskIcon: '🚨' };
  }

  if (['warning', 'medium', 'moderate'].includes(verdictNormalized)) {
    return { riskClass: 'medium-risk', riskIcon: '⚠️' };
  }

  const numericScore = Number(score) || 0;
  if (numericScore >= 70) return { riskClass: 'high-risk', riskIcon: '🚨' };
  if (numericScore >= 30) return { riskClass: 'medium-risk', riskIcon: '⚠️' };
  return { riskClass: 'low-risk', riskIcon: '✅' };
}

function updateCharCounter() {
  const content = document.getElementById('reportContent').value;
  const counter = document.getElementById('charCounter');
  if (counter) {
    counter.textContent = `${content.length} characters`;
  }
}

async function submitReport() {
  const type = document.getElementById('reportType').value;
  const content = document.getElementById('reportContent').value.trim();
  const resultDiv = document.getElementById('reportResult');
  const submitBtn = document.getElementById('reportSubmitBtn');
  
  resultDiv.textContent = '';
  resultDiv.classList.remove('show');

  // Validation
  if (!content) {
    showToast('Please provide content to report.', 'warning');
    return;
  }

  if (type === 'url' && !isValidURL(content)) {
    showToast('Please enter a valid URL.', 'error');
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
  resultDiv.innerHTML = '<div class="loading-skeleton"><div class="skeleton-line"></div></div>';
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
    
    const { riskClass, riskIcon } = getRiskMeta(data);
    
    resultDiv.innerHTML = `
      <div class="success-message">
        <span class="success-icon">${riskIcon}</span>
        <h3>Report Submitted Successfully</h3>
        <div class="report-summary">
          <p><strong>Record ID:</strong> ${data.id}</p>
          <p><strong>Verdict:</strong> ${data.verdict}</p>
          <p><strong>Risk Score:</strong> <span class="badge ${riskClass}">${data.score}/100</span></p>
        </div>
        <div class="result-actions">
          <a href="/detailed.html?id=${data.id}" class="btn-secondary">View Details →</a>
          <a href="/history.html" class="btn-secondary">View History →</a>
        </div>
      </div>
    `;
    resultDiv.classList.add('show');
    
    showToast('Report submitted and scanned successfully!', 'success');
    
    // Clear form after 2 seconds
    setTimeout(() => {
      document.getElementById('reportContent').value = '';
      updateCharCounter();
    }, 2000);
  } catch (e) {
    resultDiv.innerHTML = `<div class="error-message"><span class="error-icon">⚠</span> ${e.message}</div>`;
    resultDiv.classList.add('show');
    showToast(e.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit & Scan';
  }
}

// Event listeners
document.getElementById('reportSubmitBtn').addEventListener('click', submitReport);
document.getElementById('reportContent').addEventListener('input', updateCharCounter);

// Allow Ctrl+Enter to submit
document.getElementById('reportContent').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    submitReport();
  }
});

// Initialize
updateCharCounter();
