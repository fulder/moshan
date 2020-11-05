const urlParams = new URLSearchParams(window.location.search);

collectionName = urlParams.get("collection_name")
id = urlParams.get("id")
episodeId = urlParams.get("episode_id")

watchHistoryRequest = getWatchHistoryEpisode(collectionName, id, episodeId)

if (collectionName == "anime") {
    animeRequest = getAnimeEpisode(id, episodeId)
}

axios.all([watchHistoryRequest, animeRequest]).then(axios.spread((...responses) => {
  watchHistoryItem = responses[0].data
  animeItem = responses[1].data

  createEpisodePage(watchHistoryItem, animeItem)
})).catch(errors => {
  console.log(errors)
})

function createEpisodePage(watchHistoryItem, animeItem) {
    console.log(watchHistoryItem)
    console.log(animeItem)
}