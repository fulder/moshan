function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function authorize() {
    var codeVerifier = base64URLEncode(crypto.randomBytes(32));
    document.cookie = 'codeVerifier=' + $codeVerifier;
    
    const authorizeUrl = new URL("https://michal-test.auth.eu-west-1.amazoncognito.com/authorize");

    authorizeUrl.searchParams.append("code_challange", codeVerifier);
    authorizeUrl.searchParams.append("client_id", "1sf96sadgj6gk91tnkdathrpi0");
    authorizeUrl.searchParams.append("response_type", "code");
    authorizeUrl.searchParams.append("scope", "email+openid");
    authorizeUrl.searchParams.append("redirect_uri", "https://192.168.1.203/MySite/movio/callback.html");
    authorizeUrl.searchParams.append("code_challenge_method", "S256");

    window.location.replace(authorizeUrl.href)
}