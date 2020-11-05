options = {
    headers: {
        'Authorization': accessToken,
        'Content-Type': "application/json"
    }
}


function getWatchHistory() {
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
    axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}`, options)
      .then(function (response) {
        callback(response.data)
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeWatchHistoryItem(collectionName, id, callback) {
    axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
      .then(function (response) {
        callback(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function addWatchHistoryItem(collectionName, id, callback) {
    data = {
        item_add_id: id
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

function getWatchHistoryItem(collectionName, id) {
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
}

function addWatchHistoryEpisode(collectionName, itemId, episodeId, episodeNumber, callback) {
    data = {
        episode_id: episodeId,
        episode_number: episodeNumber
    }
    axios.post(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode`, data, options)
      .then(function (response) {
        if (callback !== undefined) {
            callback(response.data)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function removeWatchHistoryEpisode(collectionName, itemId, episodeId, callback) {
    axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
      .then(function (response) {
        if (callback !== undefined) {
            callback(response.data)
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getWatchHistoryEpisodes(collectionName, itemId, callback, startEpisode=0, limit=100) {
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode?limit=${limit}&start_episode=${startEpisode}`, options)
}

function getWatchHistoryEpisode(collectionName, itemId, episodeId) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        },
        validateStatus: (status) => status !== 404 && status !== 200
    }
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
}