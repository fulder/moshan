options = {
    headers: {
        'Authorization': accessToken,
        'Content-Type': "application/json"
    }
}

function getWatchHistoryByCollection(collectionName) {
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}`, options)
}

function removeWatchHistoryItem(collectionName, id) {
    return axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
}

function addWatchHistoryItem(collectionName, id) {
    data = {
        item_add_id: id
    }
    return axios.post(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}`, data, options)
}

function getWatchHistoryItem(collectionName, id) {
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${id}`, options)
}

function addWatchHistoryEpisode(collectionName, itemId, episodeId, episodeNumber) {
    data = {
        episode_id: episodeId,
        episode_number: episodeNumber
    }
    return axios.post(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode`, data, options)
}

function removeWatchHistoryEpisode(collectionName, itemId, episodeId) {
    return axios.delete(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
}

function getWatchHistoryEpisodes(collectionName, itemId, startEpisode=0, limit=100) {
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode?limit=${limit}&start_episode=${startEpisode}`, options)
}

function getWatchHistoryEpisode(collectionName, itemId, episodeId) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        },
        validateStatus: (status) => status >= 200 && status < 300 || status === 404
    }
    return axios.get(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
}

function updateWatchHistoryEpisode(collectionName, itemId, episodeId, watchDate="") {
    data = {}
    if (watchDate !== ""){
        data["date_watched"] = watchDate;
    }
    return axios.patch(`https://api.watch-history.moshan.tv/v1/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, data, options)
}