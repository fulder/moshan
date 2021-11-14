/* global WatchHistoryApi, accessToken */
//const urlParams = new URLSearchParams(window.location.search);

const watchHistoryApi = new WatchHistoryApi();

let currentCursor = null;
let loadingMore = false;

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createTableRows();

async function createTableRows(cursor='') {
    const response = await watchHistoryApi.getWatchHistory('backlog_date', cursor);
    const items = response.data.items;
    currentCursor = response.data.end_cursor;

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

    html = '';
    for (let i=0; i< items.length; i++) {
      html += createRow(items[i]);
    }
    document.getElementById('backlog-table-body').innerHTML += html;
}


function createRow(watchHistoryItem) {
  const api = getApiByName(watchHistoryItem.api_name);
  const moshanItem = api.getMoshanItem(watchHistoryApi.api_cache);

  let rowClass = 'bg-secondary';
  if (moshanItem.status === 'Released' || moshanItem.status === 'Airing' || moshanItem.status === 'Ended' || moshanItem.status === 'Running') {
      rowClass = 'episodeRow';
  }
  if (new Date(moshanItem.start_date) >= new Date()) {
      rowClass = 'bg-secondary';
  }

  const onClickAction = `window.location='item/index.html?api_name=${watchHistoryItem.api_name}&api_id=${watchHistoryItem.api_id}'`;
  return `
  <tr onclick="${onClickAction}" class=${rowClass}>
      <td>${watchHistoryItem.created_at}</td>
      <td>${watchHistoryItem.api_name}</td>
      <td>${moshanItem.title}</td>
      <td>${moshanItem.status}</td>
      <td>${moshanItem.start_date}</td>
    </tr>
    `;
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
