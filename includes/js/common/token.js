/* global axios */
/* exported parseJwt */

let accessToken = localStorage.getItem('moshan_access_token');
let parsedToken = null;
const interceptorMutex = new Mutex();

if (accessToken !== null) {
  parsedToken = parseJwt(accessToken);
}

function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

/* exported axiosTokenInterceptor */
async function axiosTokenInterceptor (config) {
  const release = await interceptorMutex.acquire();

  await checkToken();
  config.headers.Authorization = accessToken;
  return config;

  release();
}

async function checkToken () {
  const currentTimeStamp = Math.floor(Date.now() / 1000);

  if (parsedToken.exp < currentTimeStamp) {
    accessToken = await refreshToken();
    parsedToken = parseJwt(accessToken);
  }

  accessToken = await refreshToken();
  parsedToken = parseJwt(accessToken);
}

async function refreshToken () {
  const requestData = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: '68v5rahd0sdvrmf7fgbq2o1a9u',
    refresh_token: localStorage.getItem('moshan_refresh_token'),
  }).toString();
  const options = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  try {
    const response = await axios.post('https://auth.moshan.tv/oauth2/token', requestData, options);

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
