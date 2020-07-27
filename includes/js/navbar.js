accessToken = localStorage.getItem("moshan_access_token")

if (accessToken === null) {
    document.getElementById("loginButton").style.display = "block";
    document.getElementById("logoutButton").style.display = "none";
    document.getElementById("loginText").style.display = "none";
}
else {
    parsedToken = parseJwt(accessToken);
    currentTimeStamp = Math.floor(Date.now() / 1000)

    if (parsedToken["exp"] < currentTimeStamp) {
        refreshToken()
    }

    document.getElementById("loginButton").style.display = "none";
    document.getElementById("logoutButton").style.display = "block";
    loginText = document.getElementById("loginText");
    loginText.style.display = "block";
    loginText.innerText = "Logged in as: " + parsedToken["username"]
}

function logout() {
    localStorage.removeItem("moshan_access_token");
    localStorage.removeItem("moshan_refresh_token");
    window.location.replace("https://auth.moshan.tv/logout?logout_uri=https://moshan.tv/index.html&client_id=68v5rahd0sdvrmf7fgbq2o1a9u");
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
        url: "https://auth.moshan.tv/oauth2/token",
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