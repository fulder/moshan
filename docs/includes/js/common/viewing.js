import {parsedToken} from './token.js';

const KEY = 'moshan_view_user';

function store(user) {
  try {
    if (user && user !== parsedToken?.username) {
      localStorage.setItem(KEY, user);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // storage unavailable: stays on your own profile
  }
}

// A ?user= link (or ?user= for yourself) switches profile
const fromUrl = new URLSearchParams(window.location.search).get('user');
if (fromUrl !== null) {
  store(fromUrl);
}

// Whose profile the pages show; null is your own. Others are read-only.
export const viewingUser = (() => {
  try {
    const user = localStorage.getItem(KEY);
    return user && user !== parsedToken?.username ? user : null;
  } catch {
    return null;
  }
})();

// Keep the address bar in step, so the page can be bookmarked or shared
const url = new URL(window.location.href);
if (viewingUser !== null) {
  url.searchParams.set('user', viewingUser);
} else {
  url.searchParams.delete('user');
}
if (url.href !== window.location.href) {
  history.replaceState(history.state, '', url);
}

export function viewUser(user) {
  store(user);
  const next = new URL(window.location.href);
  if (user && user !== parsedToken?.username) {
    next.searchParams.set('user', user);
  } else {
    next.searchParams.delete('user');
  }
  window.location.href = next.href;
}
