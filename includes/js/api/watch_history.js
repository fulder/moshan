function getWatchHistory() {
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history", {
        headers: {
            'Authorization': accessToken
        }
      })
      .then(function (response) {
        watchHistory = JSON.parse(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getWatchHistoryByCollection(collectionName, callback) {
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName, {
        headers: {
            'Authorization': accessToken
        }
      })
      .then(function (response) {
        response = JSON.parse(response);
            callback(response)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeItem(collection, id) {
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collection + '/' + id, {
        headers: {
            'Authorization': accessToken
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function addItem(collectionName, id) {
    axios.post(
        "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName, {
        headers: {
            'Authorization': accessToken
            'Content-Type': "application/json"
        },
        data: {
            item_add_id: id
        }
      })
      .then(function (response) {
        response = JSON.parse(response);
            callback(response)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}