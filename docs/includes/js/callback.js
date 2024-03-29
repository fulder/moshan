import {redirectBaseUrl, clientId, cognitoDomainName} from './common/config.js';

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

const codeVerifier = localStorage.getItem('pkce_code_verifier');
const savedState = localStorage.getItem('pkce_state');

localStorage.removeItem('pkce_code_verifier');
localStorage.removeItem('pkce_state');

if (code === null) {
  document.getElementById('login_status').innerHTML = 'Login <b style=\'color:red\'>failed</b>, forwarding back to home page';
} else if (state !== savedState) {
  document.getElementById('login_status').innerHTML = 'Login <b style=\'color:red\'>failed</b>, forwarding back to home page';
} else {
  document.getElementById('login_status').innerHTML = 'Login successful, forwarding back to home page';
  sendPostAuthRequest();
}

async function sendPostAuthRequest() {
  const postData = new URLSearchParams({
    grant_type: 'authorization_code',
    redirect_uri: `${redirectBaseUrl}/callback.html`,
    code: code,
    client_id: clientId,
    code_verifier: codeVerifier,
  }).toString();

  const options = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const res = await axios.post(`https://${cognitoDomainName}/oauth2/token`, postData, options);
  const data = res.data;
  localStorage.setItem('moshan_access_token', data.access_token);
  localStorage.setItem('moshan_refresh_token', data.refresh_token);
}


