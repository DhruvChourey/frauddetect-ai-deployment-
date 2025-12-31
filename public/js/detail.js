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

async function loadDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const detailsDiv = document.getElementById('details');
  
  if (!id) {
    detailsDiv.innerHTML = '<div class="error-message">No record ID provided.</div>';
    return;
  }

  // Show loading state
  detailsDiv.innerHTML = `
    <div class="loading-skeleton">
      <div class="skeleton-line wide"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line medium"></div>
    </div>
  `;

  try {
    const resp = await fetch(`/api/record/${id}`);
    if (!resp.ok) {
      throw new Error('Record not found');
    }
    
    const record = await resp.json();
    const { riskClass, riskIcon } = getRiskMeta(record);
    
    detailsDiv.innerHTML = `
      <div class="detail-header">
        <div>
          <h2><span class="risk-icon">${riskIcon}</span> Record #${record.id}</h2>
          <p class="timestamp">${new Date(record.timestamp).toLocaleString()}</p>
        </div>
        <div class="detail-actions">
          <button onclick="copyDetails()" class="btn-secondary">📋 Copy</button>
          <button onclick="deleteRecord('${record.id}')" class="btn-danger">🗑️ Delete</button>
          <button onclick="history.back()" class="btn-secondary">← Back</button>
        </div>
      </div>
      
      <div class="detail-grid">
        <div class="detail-card">
          <h3>Assessment</h3>
          <div class="detail-item">
            <span class="detail-label">Risk Score:</span>
            <span class="badge ${riskClass}">${record.score}/100</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Verdict:</span>
            <span class="detail-value">${record.verdict}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${record.type}</span>
          </div>
        </div>
        
        <div class="detail-card">
          <h3>Analysis</h3>
          <p class="detail-reason">${record.reason}</p>
        </div>
        
        ${record.suggestedSources && record.suggestedSources.length > 0 ? `
          <div class="detail-card">
            <h3>Suggested Sources</h3>
            <ul class="sources-list">
              ${record.suggestedSources.map(source => `<li>${source}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="detail-card full-width">
          <h3>User Input</h3>
          <div class="user-input-box">
            <pre>${escapeHtml(record.userInput)}</pre>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    detailsDiv.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠</span>
        <p>${e.message}</p>
        <button onclick="history.back()" class="btn-secondary">← Go Back</button>
      </div>
    `;
    showToast(e.message, 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyDetails() {
  const detailsDiv = document.getElementById('details');
  const text = detailsDiv.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Details copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

async function deleteRecord(id) {
  if (!confirm('Are you sure you want to delete this record?')) return;
  
  try {
    const resp = await fetch(`/api/history/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      showToast('Record deleted successfully', 'success');
      setTimeout(() => window.location.href = '/history.html', 1000);
    } else {
      throw new Error('Failed to delete record');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

loadDetail();
