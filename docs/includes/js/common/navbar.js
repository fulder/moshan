import {login, logout} from './auth.js'
import {accessToken, parsedToken} from './token.js'

export async function createNavbar(showAlert = true) {
    await loadHtml();

    if (accessToken === null) {
      document.getElementById('loginButton').classList.remove('d-none');
      document.getElementById('profileDropdown').classList.add('d-none');
      if (showAlert) {
        document.getElementById('logInAlert').className = 'alert alert-danger';
      }
    } else {
      document.getElementById('loginButton').classList.add('d-none');
      document.getElementById('profileDropdown').classList.remove('d-none');
      if (!showAlert) {
        document.getElementById('logInAlert').className = 'd-none';
      }

      const profileDropDown = document.getElementById('profileDropdown');
      profileDropDown.innerHTML = parsedToken.username;
    }
}

async function loadHtml() {
    const response = await fetch("./../../includes/html/navbar.html")
    const text = await response.text()
    document.getElementById('navbar').innerHTML = text;

    document.getElementById('loginButton').addEventListener('click', login);
    document.getElementById('logoutButton').addEventListener('click', logout);
}