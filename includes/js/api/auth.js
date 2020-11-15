axios.interceptors.request.use(async function (config) {
    console.log("AXIOS INTERCEPTOR CALLED")
    await checkToken();
    config.headers["Authorization"] = accessToken;
    return config;
}, function (error) {
    console.log(error);
    return Promise.reject(error);
});