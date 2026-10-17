import {login, logout} from './auth.js';
import {accessToken, parsedToken} from './token.js';
import {cached} from './cache.js';
import {viewingUser, viewUser} from './viewing.js';
import {MoshanApi} from '../api/moshan.js';

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

// Accounts and whether you are the admin, from GET /users
export function getUsers() {
  return cached(`users_${parsedToken.username}`, 24 * 60 * 60 * 1000, () => new MoshanApi().getUsers());
}

// Switch between the accounts' profiles; others are shown read-only
async function addProfiles() {
  if (viewingUser !== null) {
    document.getElementById('viewingName').textContent = viewingUser;
    document.getElementById('viewingAlert').hidden = false;
  }

  let users;
  try {
    ({users} = await getUsers());
  } catch {
    return;
  }
  if (users.length < 2) {
    return;
  }
  // A link to each profile not shown right now
  const shown = viewingUser ?? parsedToken.username;
  const links = () => users.filter(user => user !== shown).map(user => {
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.view = user;
    a.textContent = user === parsedToken.username ? 'My profile' : user;
    a.title = user === parsedToken.username ? 'Back to your profile' : `View ${user}'s profile (read-only)`;
    return a;
  });
  document.getElementById('profiles').replaceChildren(...links());
  document.getElementById('profileListNarrow').replaceWith(...links().map(a => {
    const li = document.createElement('li');
    li.appendChild(a);
    return li;
  }));
  document.getElementById('profiles').hidden = false;
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

  document.getElementById('navbar').addEventListener('click', evt => {
    const view = evt.target.closest('[data-view]');
    if (view !== null) {
      evt.preventDefault();
      viewUser(view.dataset.view);
    }
  });

  if (loggedIn) {
    document.querySelectorAll('[data-logout]').forEach(el => el.title = `Logout ${parsedToken.username}`);
    addProfiles();
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
