import {clientId, cognitoDomainName} from './config.js';

export let accessToken = localStorage.getItem('moshan_access_token');
export let parsedToken = null;

if (accessToken !== null) {
  parsedToken = parseJwt(accessToken);
}

export function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
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
  const requestData = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: localStorage.getItem('moshan_refresh_token'),
  }).toString();
  const options = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  try {
    const response = await axios.post(`https://${cognitoDomainName}/oauth2/token`, requestData, options);

    const data = response.data;
    localStorage.setItem('moshan_access_token', data.access_token);

    if (data.refresh_token !== undefined) {
      localStorage.setItem('moshan_refresh_token', data.refresh_token);
    }

    return data.access_token;
  } catch (error) {
    console.log(error);
  }
}
