let internalClientId = '1ra91kse5btmpmt3tmran2441a';
let internalRedirectBaseUrl = 'https://moshan.fulder.dev';

// Optional local config, only looked for on localhost so the live site
// doesn't log a failed module load
if (window.location.hostname === 'localhost') {
  try {
    const { localClientId, localRedirectBaseUrl } = await import('./configLocal.js');
    internalClientId = localClientId;
    internalRedirectBaseUrl = localRedirectBaseUrl;
  } catch {
    // no configLocal.js, keep production values
  }
}


export const cognitoDomainName = 'moshan-fulder-dev.auth.eu-west-1.amazoncognito.com';
export const clientId = internalClientId;
export const redirectBaseUrl = internalRedirectBaseUrl;