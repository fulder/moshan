import {createNavbar} from './common/navbar.js';
import {getApiByName} from './api/common.js';
import {isLoggedIn} from './common/auth.js';
import {posterCard} from './common/posters.js';

createNavbar();

const qParams = {search: new URLSearchParams(window.location.search).get('search')};

const searches = [
  {apiName: 'mal', resultsElementId: 'animeResults'},
  {apiName: 'tvmaze', resultsElementId: 'showResults'},
  {apiName: 'tmdb', resultsElementId: 'movieResults'},
];

// Each source is searched and rendered independently so one API failing
// (e.g. a non-2xx response) doesn't stop the others from showing results.
async function searchAndRender(apiName, resultsElementId) {
  const el = document.getElementById(resultsElementId);
  el.setAttribute('aria-busy', 'true');

  try {
    const moshanItems = await getApiByName(apiName).search(qParams);
    el.replaceChildren(...moshanItems.items.map(moshanItem => posterCard({
      href: `/review.html?collection=${moshanItems.collection_name}&api_name=${apiName}&api_id=${moshanItem.id}`,
      image: moshanItem.imageUrl,
      title: moshanItem.title,
    })));
    if (moshanItems.items.length === 0) {
      el.innerHTML = '<small>No results.</small>';
    }
  } catch (err) {
    console.error(`Search failed for ${apiName}`, err);
    el.innerHTML = '<small>Search is unavailable right now.</small>';
  }

  el.removeAttribute('aria-busy');
}

if (isLoggedIn() && qParams.search) {
  searches.forEach(({apiName, resultsElementId}) => searchAndRender(apiName, resultsElementId));
}
