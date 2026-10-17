export class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
  }
}

// All anime data comes from Tenrai; when it is down, say so instead of
// leaving pages empty or loading forever
function showTenraiDown(url) {
  if (!url.startsWith('https://api.tenrai.org/') || document.getElementById('tenraiDown')) {
    return;
  }
  const alert = document.createElement('p');
  alert.id = 'tenraiDown';
  alert.className = 'alert';
  alert.innerHTML = 'Anime data source Tenrai is down, anime info may be missing. '
    + '<a href="https://tenrai.org/status" target="_blank" rel="noopener">Status page</a>';
  document.querySelector('main')?.prepend(alert);
}

export async function request(url, {method = 'GET', headers = {}, body, keepalive = false} = {}) {
  let res;
  try {
    res = await fetch(url, {method, headers, body, keepalive});
  } catch (error) {
    // Outage error pages (e.g. Cloudflare 530) lack CORS headers, so fetch
    // fails without a status
    showTenraiDown(url);
    throw error;
  }
  if (!res.ok) {
    if (res.status >= 500) {
      showTenraiDown(url);
    }
    throw new HttpError(res.status, url);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function postForm(url, data) {
  return request(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data).toString(),
  });
}
