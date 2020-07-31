//See: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript/1349462
// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex (dec) {
  return dec < 10
    ? '0' + String(dec)
    : dec.toString(16)
}
// generateId :: Integer -> String
function generateRandomString () {
  var arr = new Uint8Array(40 / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}
// --------------------

// Calculate SHA-256 hash from verifier data and base64 encode it
function sha256(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    return window.crypto.subtle.digest('SHA-256', data);
}
async function codeChallengeFromVerifier(verifier) {
    hashed = await sha256(verifier);
    return base64URLEncode(hashed);
}
function base64URLEncode(str) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function authorize() {
    codeVerifier = generateRandomString()

    codeChallenge = await codeChallengeFromVerifier(codeVerifier)
    state = generateRandomString()

    localStorage.setItem("pkce_code_verifier", codeVerifier);
    localStorage.setItem("pkce_state", state);
    
    const authorizeUrl = new URL("https://auth.moshan.tv/authorize");

    authorizeUrl.searchParams.append("code_challenge", codeChallenge);
    authorizeUrl.searchParams.append("client_id", "68v5rahd0sdvrmf7fgbq2o1a9u");
    authorizeUrl.searchParams.append("response_type", "code");
    authorizeUrl.searchParams.append("scope", "email openid");
    authorizeUrl.searchParams.append("redirect_uri", "https://" + window.location.hostname + "/callback.html");
    authorizeUrl.searchParams.append("code_challenge_method", "S256");
    authorizeUrl.searchParams.append("state", state);

    window.location.href = authorizeUrl.href
}