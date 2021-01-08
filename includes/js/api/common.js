let checkTokenPromise = null;

/* exported allowedNotFoundStatus */
function allowedNotFoundStatus (status) {
  if (status >= 200 && status < 300) {
    return true;
  } else if (status === 404) {
    return true;
  }
  return false;
}

/* exported axiosTokenInterceptor */
async function axiosTokenInterceptor (config) {
  if (checkTokenPromise === null) {
    checkTokenPromise = checkToken();
  }

  await checkTokenPromise;
  checkTokenPromise = null;
  config.headers.Authorization = accessToken;
  return config;
}
