const urlParams = new URLSearchParams(window.location.search);

collectionName = urlParams.get("collection_name")
id = urlParams.get("id")
episodeId = urlParams.get("episode_id")

if (collectionName == "anime") {
    animeRequest = getAnimeEpisode(id, episodeId)
}
watchHistoryRequest = getWatchHistoryEpisode(collectionName, id, episodeId)

axios.all([animeRequest, watchHistoryRequest]).then(axios.spread((...responses) => {
  animeItem = responses[0].data
  watchHistoryItem = responses[1].data

  createEpisodePage(animeItem, watchHistoryItem)
})).catch(error  => {
  if (error.response) {
    if (error.response.status === 404 && error.response.config.url.includes("watch-history")) {
        createEpisodePage(animeItem)
    }
    console.log(error.response)
  }

  console.log(errors)
})

function createEpisodePage(animeItem, watchHistoryItem) {
    console.log(animeItem)
    console.log(watchHistoryItem)
}