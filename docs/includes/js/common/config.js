import {localClientId, localRedirectBaseUrl} from './configLocal.js'

export const cognitoDomainName = 'moshan-fulder-dev.auth.eu-west-1.amazoncognito.com';

export let clientId = '1ra91kse5btmpmt3tmran2441a';
export let redirectBaseUrl = 'https://moshan.fulder.dev';

if (localClientId !== "") {
    clientId = localClientId;
}

if (localRedirectBaseUrl !== "") {
    redirectBaseUrl = localRedirectBaseUrl;
}