import {createNavbar} from './common/navbar.js';
import {MoshanApi} from './api/moshan.js';
import {isLoggedIn} from './common/auth.js';

createNavbar();

const moshanApi = new MoshanApi();

let currentCursor = null;
let loadingMore = false;

if (isLoggedIn()) {
    createTableRows();
}

async function createTableRows(cursor='') {
    const response = await moshanApi.getItems('rating', cursor, 'onlyBacklog');
    const items = response.data.items;

    currentCursor = null;
    if ('endCursor' in response.data) {
        currentCursor = response.data.endCursor;
    }

    // const apiRequests = [];
    // for (let i=0; i < items.length; i++) {
    //   const apiName = items[i]['api_name'];
    //   const apiId = items[i]['api_id'];


      // if (apiName !== 'mal') {
      //   const api = getApiByName(apiName);
      //   apiRequests.push(api.getItemById({ 'api_id': apiId }));
      // }
    // }

    // const responses = await Promise.all(apiRequests);
    // const moshanItems = {};
    // for (let i=0; i< responses.length; i++) {
    //   moshanItems[`${responses[i].api_name}_${responses[i].id}`] = responses[i];
    // }

    for (let i=0; i< items.length; i++) {
      createRow(items[i]);
    }
}


function createRow(watchHistoryItem) {
  const apiCache = watchHistoryItem.apiCache;

  let rowClass = 'bg-secondary';
  if (apiCache.status === 'Released' || apiCache.status === 'Airing' || apiCache.status === 'Ended' || apiCache.status === 'Running' || apiCache.status === 'Finished Airing') {
      rowClass = 'episodeRow';
  }
  if (new Date(apiCache.releaseDate) >= new Date()) {
      rowClass = 'bg-secondary';
  }

  if ('releaseDate' in apiCache && apiCache.releaseDate !== null) {
    apiCache.releaseDate = apiCache.releaseDate.split('T')[0];
  }

    /*
    <tr class=${rowClass}>
      <td>${watchHistoryItem.createdAt}</td>
      <td>${watchHistoryItem.rating}</td>
      <td>${watchHistoryItem.apiName}</td>
      <td>${apiCache.title}</td>
      <td>${apiCache.status}</td>
      <td>${apiCache.releaseDate}</td>
    </tr>
    */
    const tableRow = document.createElement('tr');
    tableRow.className = rowClass;
    tableRow.addEventListener('click', function(){ window.open(`review.html?api_name=${watchHistoryItem.apiName}&api_id=${watchHistoryItem.apiId}`, '_self'); });

    const columnValues = [
        watchHistoryItem.createdAt,
        watchHistoryItem.rating,
        watchHistoryItem.apiName,
        apiCache.title,
        apiCache.status,
        apiCache.releaseDate,
    ];
    for (let i = 0; i < columnValues.length; i++) {
        const td = document.createElement('td');
        td.innerHTML = columnValues[i];
        tableRow.appendChild(td);
    }

    document.getElementById('backlog-table-body').appendChild(tableRow);
}

async function loadMore() {
  if (loadingMore || currentCursor === null) {
    // Don't trigger load more than once and only if there are more items
    return;
  }
  loadingMore = true;

  await createTableRows(currentCursor);

  loadingMore = false;
}

document.addEventListener('scroll', function() {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      loadMore();
  }
});
