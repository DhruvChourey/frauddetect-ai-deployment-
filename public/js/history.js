let _historyData = [];
let _currentSort = { field: 'timestamp', order: 'desc' };

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

async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><div class="spinner"></div> Loading history...</td></tr>';
  
  try {
    const resp = await fetch('/api/history');
    if (!resp.ok) throw new Error('Failed to load history');
    
    const data = await resp.json();
    _historyData = data;
    renderTable();
    updateStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="error-cell">⚠ ${e.message}</td></tr>`;
    showToast(e.message, 'error');
  }
}

function updateStats() {
  const statsDiv = document.getElementById('stats');
  if (!statsDiv) return;
  
  const total = _historyData.length;
  const highRisk = _historyData.filter(r => r.score <= 30).length;
  const mediumRisk = _historyData.filter(r => r.score > 30 && r.score <= 60).length;
  const lowRisk = _historyData.filter(r => r.score > 60).length;
  
  statsDiv.innerHTML = `
    <div class="stat-item" style="--index: 0"><span class="stat-label">Total Scans</span> <span class="stat-value">${total}</span></div>
    <div class="stat-item high" style="--index: 1"><span class="stat-label">High Risk</span> <span class="stat-value">${highRisk}</span></div>
    <div class="stat-item medium" style="--index: 2"><span class="stat-label">Medium Risk</span> <span class="stat-value">${mediumRisk}</span></div>
    <div class="stat-item low" style="--index: 3"><span class="stat-label">Low Risk</span> <span class="stat-value">${lowRisk}</span></div>
  `;
}

function sortData(field) {
  if (_currentSort.field === field) {
    _currentSort.order = _currentSort.order === 'asc' ? 'desc' : 'asc';
  } else {
    _currentSort.field = field;
    _currentSort.order = 'desc';
  }
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('historyTableBody');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value;

  let filtered = (_historyData || [])
    .filter(r => {
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const text = `${r.userInput} ${r.verdict} ${r.reason}`.toLowerCase();
      const matchesSearch = !search || text.includes(search);
      return matchesType && matchesSearch;
    });

  // Sort data
  filtered.sort((a, b) => {
    let valA = a[_currentSort.field];
    let valB = b[_currentSort.field];
    
    if (_currentSort.field === 'timestamp') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else if (_currentSort.field === 'score') {
      valA = parseInt(valA);
      valB = parseInt(valB);
    }
    
    if (valA < valB) return _currentSort.order === 'asc' ? -1 : 1;
    if (valA > valB) return _currentSort.order === 'asc' ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No records found</td></tr>';
    return;
  }

  filtered.forEach((record, index) => {
    const riskClass = record.score <= 30 ? 'high-risk' : record.score <= 60 ? 'medium-risk' : 'low-risk';
    const tr = document.createElement('tr');
    tr.className = 'table-row';
    tr.style.animationDelay = `${index * 0.05}s`;
    tr.innerHTML = `
      <td>${new Date(record.timestamp).toLocaleString()}</td>
      <td><span class="type-badge">${record.type}</span></td>
      <td><span class="badge ${riskClass}">${record.score}</span></td>
      <td>${record.verdict}</td>
      <td class="action-cell">
        <a class="table-link" href="/detailed.html?id=${record.id}">👁️ View</a>
        <button data-id="${record.id}" class="delete-btn" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Add delete event listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = e.target.getAttribute('data-id');
      if (!confirm('Delete this record?')) return;
      
      try {
        const resp = await fetch(`/api/history/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          showToast('Record deleted', 'success');
          await loadHistory();
        } else {
          throw new Error('Failed to delete');
        }
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });

  // Update sort indicators
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === _currentSort.field) {
      th.classList.add(`sort-${_currentSort.order}`);
    }
  });
}

function exportToCSV() {
  if (_historyData.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }
  
  const headers = ['ID', 'Timestamp', 'Type', 'Score', 'Verdict', 'Reason', 'User Input'];
  const rows = _historyData.map(r => [
    r.id,
    new Date(r.timestamp).toLocaleString(),
    r.type,
    r.score,
    r.verdict,
    r.reason,
    r.userInput.replace(/"/g, '""')
  ]);
  
  let csv = headers.join(',') + '\n';
  csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fraudshield-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('History exported successfully', 'success');
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('typeFilter').addEventListener('change', renderTable);

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (!confirm('Clear all history? This cannot be undone.')) return;
  
  try {
    const resp = await fetch('/api/history', { method: 'DELETE' });
    if (resp.ok) {
      showToast('History cleared', 'success');
      await loadHistory();
    } else {
      throw new Error('Failed to clear history');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
});

// Add sort click handlers
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => sortData(th.dataset.sort));
  th.style.cursor = 'pointer';
});

// Initialize
loadHistory();
