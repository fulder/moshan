function getWatchHistory() {
    options = {
        headers: {
            'Authorization': accessToken
        }
    }
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history", options)
      .then(function (response) {
        watchHistory = JSON.parse(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getWatchHistoryByCollection(collectionName, callback) {
    options = {
        headers: {
            'Authorization': accessToken
        }
    }
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName, options)
      .then(function (response) {
        response = JSON.parse(response.data);
            callback(response)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeItem(collection, id) {
    options = {
        headers: {
            'Authorization': accessToken
        }
    }
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collection + '/' + id, options)
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function addItem(collectionName, id) {
    data = {
        item_add_id: id
    }
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.post("https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName, data, options)
      .then(function (response) {
        response = JSON.parse(response.data);
        callback(response)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}