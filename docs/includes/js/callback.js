import {redirectBaseUrl, clientId, cognitoDomainName} from './common/config.js';
import {postForm} from './common/http.js';

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

const codeVerifier = localStorage.getItem('pkce_code_verifier');
const savedState = localStorage.getItem('pkce_state');

localStorage.removeItem('pkce_code_verifier');
localStorage.removeItem('pkce_state');

const status = document.getElementById('login_status');

try {
  if (code === null || state !== savedState) {
    throw new Error('Invalid login callback');
  }

  const data = await postForm(`https://${cognitoDomainName}/oauth2/token`, {
    grant_type: 'authorization_code',
    redirect_uri: `${redirectBaseUrl}/callback.html`,
    code: code,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
  localStorage.setItem('moshan_access_token', data.access_token);
  localStorage.setItem('moshan_refresh_token', data.refresh_token);

  window.location.replace('/watching.html');
} catch (error) {
  console.log(error);
  status.textContent = 'Login failed, forwarding back to home page';
  setTimeout(() => window.location.replace('/index.html'), 2000);
}
