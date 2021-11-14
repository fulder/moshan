/* global WatchHistoryApi, accessToken */
//const urlParams = new URLSearchParams(window.location.search);

const watchHistoryApi = new WatchHistoryApi();

if (accessToken === null) {
  document.getElementById('logInAlert').className = 'alert alert-danger';
} else {
  document.getElementById('logInAlert').className = 'd-none';
}

createTableRows();

async function createTableRows() {
    const response = await watchHistoryApi.getWatchHistory('backlog_date');
    const items = response.data.items;

    const apiRequests = [];
    for (let i=0; i < items.length; i++) {
      const apiName = items[i]['api_name'];
      const apiId = items[i]['api_id'];
      if (apiName !== 'mal') {
        const api = getApiByName(apiName);
        apiRequests.push(api.getItemById({ 'api_id': apiId }));
      }
    }

    const responses = await Promise.all(apiRequests);
    const moshanItems = {};
    for (let i=0; i< responses.length; i++) {
      moshanItems[`${responses[i].api_name}_${responses[i].id}`] = responses[i];
    }

    html = '';
    for (let i=0; i< items.length; i++) {
      html += createRow(items[i], moshanItems);
    }
    document.getElementById('backlog-table-body').innerHTML = html;
}


function createRow(watchHistoryItem, moshanItems) {
  moshanItem = moshanItems[`${watchHistoryItem.api_name}_${watchHistoryItem.api_id}`];

  let rowClass = 'bg-secondary';
  let title = 'N/A';
  let status = 'N/A';
  let startDate = 'N/A';
  if (moshanItem !== undefined) {
    if (moshanItem.status === 'Released' || moshanItem.status === 'Airing' || moshanItem.status === 'Ended' || moshanItem.status === 'Running') {
        rowClass = 'episodeRow';
    }
    if (new Date(moshanItem.start_date) >= new Date()) {
        rowClass = 'bg-secondary';
    }

    title = moshanItem.title;
    status = moshanItem.status;
    startDate = moshanItem.start_date;
  }

  const onClickAction = `window.location='item/index.html?api_name=${watchHistoryItem.api_name}&api_id=${watchHistoryItem.api_id}'`;
  return `
  <tr onclick="${onClickAction}" class=${rowClass}>
      <td>${watchHistoryItem.created_at}</td>
      <td>${watchHistoryItem.api_name}</td>
      <td>${title}</td>
      <td>${status}</td>
      <td>${startDate}</td>
    </tr>
    `;
}

document.body.addEventListener('scroll', function(event) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight)
    {
        console.log('scrolled');
    }
});
