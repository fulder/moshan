export class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
  }
}

export async function request(url, {method = 'GET', headers = {}, body} = {}) {
  const res = await fetch(url, {method, headers, body});
  if (!res.ok) {
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
