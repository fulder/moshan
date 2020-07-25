function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
var codeVerifier = base64URLEncode(crypto.randomBytes(32));

document.cookie = 'codeVerifier=' + $codeVerifier;
window.location.replace('https://michal-test.auth.eu-west-1.amazoncognito.com/authorize?code_challenge=' + codeVerifier + '&client_id=1sf96sadgj6gk91tnkdathrpi0&response_type=code&scope=email+openid&redirect_uri=https://192.168.1.203/MySite/movio/callback.html&code_challenge_method=S256')