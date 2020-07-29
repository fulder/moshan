getWatchHistoryByCollection("anime", createAnimeItems);

function createAnimeItems(response) {
    resultHTML = ""
    items = Object.values(response["items"])
    items.forEach(createHistoryAnimeItem);

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}