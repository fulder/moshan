accessToken = localStorage.getItem("moshan_access_token")

if (accessToken !== null) {
    parsedToken = parseJwt(accessToken);
    currentTimeStamp = Math.floor(Date.now() / 1000)

    if (parsedToken["exp"] < currentTimeStamp) {
        refreshToken()
    }
}

function parseJwt(token){
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function refreshToken(){
    axios.post(
        "https://auth.moshan.tv/oauth2/token",
        data: {
            grant_type: "refresh_token",
            client_id: "68v5rahd0sdvrmf7fgbq2o1a9u",
            refresh_token: localStorage.getItem("moshan_refresh_token")
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      )
      .then(function (response) {
         localStorage.setItem("moshan_access_token", response["access_token"])

        if(response["refresh_token"] !== undefined) {
            localStorage.setItem("moshan_refresh_token", response["refresh_token"])
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}