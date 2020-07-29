getWatchHistoryByCollection("anime", createAnimeItems);

function getWatchHistory() {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history",
        type: "get",
        headers: {
            'Authorization': accessToken
        },
        success:function(response) {
            watchHistory = JSON.parse(response);
        },
    });
}

function getWatchHistoryByCollection(collection, callback) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collection,
        type: "get",
        headers: {
            'Authorization': accessToken
        },
        success:function(response) {
            response = JSON.parse(response);
            callback(response)
        },
    });
}

function createAnimeItems(response) {
    resultHTML = ""
    items = Object.values(response["items"])
    items.forEach(createHistoryAnimeItem);

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}