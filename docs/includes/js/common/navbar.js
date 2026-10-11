import {login, logout} from './auth.js';
import {accessToken, parsedToken} from './token.js';

// Data source credits in every page footer (TMDB's terms require its logo and notice)
function addCredits() {
  const footer = document.querySelector('body > footer');
  if (footer === null) {
    return;
  }
  const credits = document.createElement('p');
  credits.className = 'credits';
  credits.innerHTML = `<small>
    <a href="https://www.themoviedb.org"><img src="/includes/img/tmdb.svg" alt="TMDB"></a>
    This product uses the TMDB API but is not endorsed or certified by TMDB.
    Shows from <a href="https://www.tvmaze.com">TVmaze</a>
    (<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA</a>),
    anime from <a href="https://tenrai.org">Tenrai</a> / <a href="https://myanimelist.net">MyAnimeList</a>.
  </small>`;
  footer.appendChild(credits);
}

export async function createNavbar(showAlert = true) {
  addCredits();
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
