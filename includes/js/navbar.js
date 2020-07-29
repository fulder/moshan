if (parsedToken === null) {
    document.getElementById("loginButton").style.display = "block";
    document.getElementById("profileDropdown").style.display = "none";
    document.getElementById("loginText").style.display = "none";
}
else {
    document.getElementById("loginButton").style.display = "none";

    profileDropDown = document.getElementById("profileDropdown");
    profileDropDown.style.display = "block";
    profileDropDown.innerHTML = parsedToken["username"]
}

function logout() {
    localStorage.removeItem("moshan_access_token");
    localStorage.removeItem("moshan_refresh_token");
    window.location.replace("https://auth.moshan.tv/logout?logout_uri=https://moshan.tv/index.html&client_id=68v5rahd0sdvrmf7fgbq2o1a9u");
}

