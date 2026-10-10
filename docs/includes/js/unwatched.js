import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';
import {hideDoneToggle, itemCard} from './common/posters.js';

createNavbar();

const moshanApi = new MoshanApi();
const list = document.getElementById('unwatched');
hideDoneToggle(list);

if (isLoggedIn()) {
  list.setAttribute('aria-busy', 'true');
  const response = await moshanApi.getItems('epProgress');
  list.removeAttribute('aria-busy');

  list.append(...response.items.map(item => itemCard(item, true)));
}
