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

    request = $.ajax({
        url: "https://michal-test.auth.eu-west-1.amazoncognito.com/oauth2/token",
        type: "post",
        data: {
            grant_type: "authorization_code",
            redirect_uri: "https://192.168.1.203/MySite/movio/callback.html",
            code: code,
            client_id: "1sf96sadgj6gk91tnkdathrpi0",
            code_verifier: codeVerifier
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        success:function(response) {
            console.log(response)
        },
    });
}

localStorage.removeItem("pkce_code_verifier");
localStorage.removeItem("pkce_state");

