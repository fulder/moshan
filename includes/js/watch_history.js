document.getElementById("animeWatchHistory").innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>'

getWatchHistoryByCollection("anime", createAnimeItems);

function createAnimeItems(response) {
    resultHTML = ""
    items = Object.values(response["items"])
    items.forEach(createHistoryAnimeItem);

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}