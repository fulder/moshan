const urlParams = new URLSearchParams(window.location.search);

collectionName = urlParams.get("collection_name")
id = urlParams.get("id")
episodeId = urlParams.get("episode_id")

watchHistoryRequest = getWatchHistoryEpisode(collectionName, id, episodeId)

if (collectionName == "anime") {
    collectionRequest = getAnimeEpisode(id, episodeId)
}

axios.all([watchHistoryRequest, collectionRequest]).then(axios.spread((...responses) => {
  watchHistoryItem = responses[0].data
  collectionItem = responses[1].data

  createEpisodePage(watchHistoryItem, collectionItem)
})).catch(errors => {
  console.log(errors)
})

function createEpisodePage(watchHistoryItem, collectionItem) {
    console.log(watchHistoryItem)
    console.log(collectionItem)
}