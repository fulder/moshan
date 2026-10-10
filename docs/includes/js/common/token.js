import {clientId, cognitoDomainName} from './config.js';
import {postForm} from './http.js';

export let accessToken = localStorage.getItem('moshan_access_token');
export let parsedToken = null;

if (accessToken !== null) {
  parsedToken = parseJwt(accessToken);
}

export function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export async function checkToken () {
  const currentTimeStamp = Math.floor(Date.now() / 1000);

  if (parsedToken !== null && parsedToken.exp < currentTimeStamp) {
    accessToken = await refreshToken();
    parsedToken = parseJwt(accessToken);
  }
}

async function refreshToken () {
  try {
    const data = await postForm(`https://${cognitoDomainName}/oauth2/token`, {
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: localStorage.getItem('moshan_refresh_token'),
    });

    localStorage.setItem('moshan_access_token', data.access_token);

    if (data.refresh_token !== undefined) {
      localStorage.setItem('moshan_refresh_token', data.refresh_token);
    }

    return data.access_token;
  } catch (error) {
    console.log(error);
  }
}
