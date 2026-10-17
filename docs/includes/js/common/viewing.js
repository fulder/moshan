import {parsedToken} from './token.js';

const KEY = 'moshan_view_user';

// Whose profile the pages show; null is your own. Others are read-only.
export const viewingUser = (() => {
  try {
    const user = localStorage.getItem(KEY);
    return user && user !== parsedToken?.username ? user : null;
  } catch {
    return null;
  }
})();

export function viewUser(user) {
  try {
    if (user && user !== parsedToken?.username) {
      localStorage.setItem(KEY, user);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // storage unavailable: stays on your own profile
  }
  window.location.reload();
}
