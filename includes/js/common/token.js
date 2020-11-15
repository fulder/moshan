axios.interceptors.request.use(async function (config) {
    await checkToken();
    config.headers["Authorization"] = accessToken;
    return config;
}, function (error) {
    console.log(error);
    return Promise.reject(error);
});

async function checkToken() {
    accessToken = localStorage.getItem("moshan_access_token")

    if (accessToken !== null) {
        parsedToken = parseJwt(accessToken);
        currentTimeStamp = Math.floor(Date.now() / 1000)

        if (parsedToken["exp"] < currentTimeStamp) {
            accessToken = await refreshToken()
        }
    }
}

function parseJwt(token){
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

async function refreshToken(){
    data = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: "68v5rahd0sdvrmf7fgbq2o1a9u",
        refresh_token: localStorage.getItem("moshan_refresh_token")
    }).toString();
    options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }

    try {
        response = await axios.post("https://auth.moshan.tv/oauth2/token", data, options)

        data = response.data;
        localStorage.setItem("moshan_access_token", data["access_token"])

        if(data["refresh_token"] !== undefined) {
            localStorage.setItem("moshan_refresh_token", data["refresh_token"])
        }

        return data["access_token"];
    } catch(error) {
        console.log(error);
    }
}