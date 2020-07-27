accessToken = localStorage.getItem("moshan_access_token")

if (accessToken === null) {
    document.getElementById("loginButton").style.display = "block";
    document.getElementById("loginText").style.display = "none";
}
else {
    parsedToken = parseJwt(accessToken);
    currentTimeStamp = Math.floor(Date.now() / 1000)

    if (parsedToken["exp"] < currentTimeStamp) {
        refreshToken()
    }

    document.getElementById("loginButton").style.display = "none";
    loginText = document.getElementById("loginText");
    loginText.style.display = "block";
    loginText.innerText = "Logged in as: " + parsedToken["username"]
}

function logout() {
    $.ajax({
        url: "https://michal-test.auth.eu-west-1.amazoncognito.com/logout",
        type: "get",
        data: {
            logout_uri: "https://moshan.tv/index.html",
            client_id: "68v5rahd0sdvrmf7fgbq2o1a9u",
        }
    });

}


function parseJwt(token){
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function refreshToken(){
    $.ajax({
        url: "https://michal-test.auth.eu-west-1.amazoncognito.com/oauth2/token",
        type: "post",
        data: {
            grant_type: "refresh_token",
            client_id: "68v5rahd0sdvrmf7fgbq2o1a9u",
            refresh_token: localStorage.getItem("moshan_refresh_token")
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        success:function(response) {
            localStorage.setItem("moshan_access_token", response["access_token"])

            if(response["refresh_token"] != "undfined") {
                localStorage.setItem("moshan_refresh_token", response["refresh_token"])
            }
        },
    });
}