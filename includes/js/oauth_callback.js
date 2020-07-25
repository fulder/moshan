const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

const codeVerifier = document.cookie
  .split('; ')
  .find(row => row.startsWith('codeVerifier'))
  .split('=')[1];
document.cookie = 'codeVerifier=' + $codeVerifier;

request = $.ajax({
    url: "https://michal-test.auth.eu-west-1.amazoncognito.com/oauth2/token",
    type: "post",
    data: {
        grant_type: "authorization_code",
        redirect_uri: "https://192.168.1.203/MySite/movio/callback.html",
        code: code,
        client_id: "21sf96sadgj6gk91tnkdathrpi0",
        code_verifier: codeVerifier
    },
    success:function(response) {
        document.getElementById("disp").innerHTML =response;
    },
});

