const watchHistoryAxios = axios.create({
    baseURL: 'ttps://api.watch-history.moshan.tv/v1',
    headers: {
      'Content-Type': "application/json"
    }
})

watchHistoryAxios.interceptors.request.use(async function (config) {
    console.log("AXIOS INTERCEPTOR CALLED")
    await checkToken();
    config.headers["Authorization"] = accessToken;
    return config;
}, function (error) {
    console.log(error);
    return Promise.reject(error);
});

function getWatchHistoryByCollection(collectionName) {
    return watchHistoryAxios.get(`/watch-history/collection/${collectionName}`)
}

function removeWatchHistoryItem(collectionName, id) {
    return watchHistoryAxios.delete(`/watch-history/collection/${collectionName}/${id}`)
}

function addWatchHistoryItem(collectionName, id) {
    data = {
        item_add_id: id
    }
    return watchHistoryAxios.post(`/watch-history/collection/${collectionName}`, data)
}

function getWatchHistoryItem(collectionName, id) {
    return watchHistoryAxios.get(`/watch-history/collection/${collectionName}/${id}`)
}

function addWatchHistoryEpisode(collectionName, itemId, episodeId, episodeNumber) {
    data = {
        episode_id: episodeId,
        episode_number: episodeNumber
    }
    return watchHistoryAxios.post(`/watch-history/collection/${collectionName}/${itemId}/episode`, data)
}

function removeWatchHistoryEpisode(collectionName, itemId, episodeId) {
    return watchHistoryAxios.delete(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`)
}

function getWatchHistoryEpisodes(collectionName, itemId, startEpisode=0, limit=100) {
    return watchHistoryAxios.get(`/watch-history/collection/${collectionName}/${itemId}/episode?limit=${limit}&start_episode=${startEpisode}`)
}

function getWatchHistoryEpisode(collectionName, itemId, episodeId) {
    options = {
        validateStatus: (status) => status >= 200 && status < 300 || status === 404
    }

    return watchHistoryAxios.get(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, options)
}

function updateWatchHistoryEpisode(collectionName, itemId, episodeId, watchDate="") {
    data = {}
    if (watchDate !== ""){
        data["date_watched"] = watchDate;
    }
    return watchHistoryAxios.patch(`/watch-history/collection/${collectionName}/${itemId}/episode/${episodeId}`, data)
}