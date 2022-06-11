let internalClientId, internalRedirectBaseUrl;

try {
  // hack for local config
  if ((new File('./configLocal.js').exists())) {
    const { localClientId, localRedirectBaseUrl } = await import('./configLocal.js');

    console.log(localClientId)

    internalClientId = localClientId;
    internalRedirectBaseUrl = localRedirectBaseUrl;
  }
} catch(err) {
    internalClientId = '1ra91kse5btmpmt3tmran2441a';
    internalRedirectBaseUrl= 'https://moshan.fulder.dev';
}

export const cognitoDomainName = 'moshan-fulder-dev.auth.eu-west-1.amazoncognito.com';
export const clientId = internalClientId;
export const redirectBaseUrl = internalRedirectBaseUrl;