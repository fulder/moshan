accessToken = localStorage.getItem("moshan_access_token")

if (accessToken === null) {
    document.getElementById("loginButton").style.display = "block";
    document.getElementById("loginText").style.display = "none";
}
else {
    document.getElementById("loginButton").style.display = "none";

    loginText = document.getElementById("loginText");
    loginText.style.display = "block";

    parsedToken = parseJwt(accessToken);
    loginText.innerText = "Logged in as: " + parsedToken["username"]
}


function parseJwt(token){
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}