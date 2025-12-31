
async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText.slice(0, 12000)
  });
  return result;
}

document.getElementById('scanPage').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Scanning page...';

  try {
    const text = await getPageText();
    const backend = document.getElementById('backendUrl').value.replace(/\/$/, '');
    const resp = await fetch(`${backend}/api/scan-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await resp.json();
    if (!resp.ok) {
      status.textContent = data.error || 'Scan failed.';
      return;
    }
    status.textContent = `Verdict: ${data.verdict} (score ${data.score})`;
  } catch (e) {
    status.textContent = 'Error running scan.';
  }
});
