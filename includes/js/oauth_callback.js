const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if(code === null) {
    document.getElementById("login_status").innerHTML = "Login <b style='color:red'>failed</b>, forwarding back to home page"
}
else if (state != localStorage.getItem("pkce_state")) {
    document.getElementById("login_status").innerHTML = "Login <b style='color:red'>failed</b>, forwarding back to home page"
}
else {
    document.getElementById("login_status").innerHTML = "Login successful, forwarding back to home page"
    const codeVerifier = localStorage.getItem("pkce_code_verifier");

    axios.post("https://auth.moshan.tv/oauth2/token", {
        data: {
            grant_type: "authorization_code",
            redirect_uri: "https://" + window.location.hostname + "/callback.html",
            code: code,
            client_id: "68v5rahd0sdvrmf7fgbq2o1a9u",
            code_verifier: codeVerifier
        },
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      .then(function (response) {
         localStorage.setItem("moshan_access_token", response["access_token"])
         localStorage.setItem("moshan_refresh_token", response["refresh_token"])
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

localStorage.removeItem("pkce_code_verifier");
localStorage.removeItem("pkce_state");

