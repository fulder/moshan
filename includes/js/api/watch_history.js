function getWatchHistory() {
    options = {
        headers: {
            'Authorization': accessToken
        }
    }
    axios.get("https://api.watch-history.moshan.tv/v1/watch-history", options)
      .then(function (response) {
        watchHistory = response.data;
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
    axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}`, options)
      .then(function (response) {
        callback(response.data)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeItem(collectionName, id, callback) {
    options = {
        headers: {
            'Authorization': accessToken
        }
    }
    axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
      .then(function (response) {
        callback(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function addItem(collectionName, id, callback) {
    data = {
        item_add_id: id
    }
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.post(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}`, data, options)
      .then(function (response) {
        callback(response.data)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getItem(collectionName, id, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
      .then(function (response) {
        callback(response.data)
      })
      .catch(function (error) {
        // handle error
        callback(null)
      });
}

function addEpisode(collectionName, itemId, episodeId, episodeNumber, callback) {
    data = {
        episode_id: episodeId,
        episode_number: episodeNumber
    }
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    console.log(callback);
    axios.post(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode`, data, options)
      .then(function (response) {
        if (callback !== null) {
            callback(response.data)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeEpisode(collectionName, itemId, episodeId, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
      .then(function (response) {
        if (callback !== null) {
            callback(response.data)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getEpisodes(collectionName, itemId, callback, startEpisode=0, limit=100) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode?limit=${limit}&start_episode=${startEpisode}`, options)
      .then(function (response) {
        if (callback !== null) {
            callback(response.data)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}