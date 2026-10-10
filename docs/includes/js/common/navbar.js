import {login, logout} from './auth.js';
import {accessToken, parsedToken} from './token.js';

export async function createNavbar(showAlert = true) {
  const response = await fetch('/includes/html/navbar.html');
  document.getElementById('navbar').innerHTML = await response.text();

  document.getElementById('loginButton').addEventListener('click', login);
  document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', logout));

  const loggedIn = accessToken !== null;
  document.querySelectorAll('[data-auth]').forEach(el => el.hidden = !loggedIn);
  document.querySelectorAll('[data-guest]').forEach(el => el.hidden = loggedIn);

  if (loggedIn) {
    document.querySelectorAll('[data-logout]').forEach(el => el.title = `Logout ${parsedToken.username}`);
  } else if (showAlert) {
    document.getElementById('logInAlert').hidden = false;
  }

  for (const a of document.querySelectorAll('nav a')) {
    if (a.pathname === window.location.pathname) {
      a.setAttribute('aria-current', 'page');
    }
  }

  const search = new URLSearchParams(window.location.search).get('search');
  if (search !== null) {
    document.querySelector('nav input[name=search]').value = search;
  }
}
