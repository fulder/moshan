if (accessToken === null) {
    document.getElementById("logInAlert").className = "alert alert-danger";
}
else {
    document.getElementById("logInAlert").className = "d-none";
    document.getElementById("animeWatchHistory").innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>'
}

getWatchHistoryByCollection("anime", createAnimeItems);

function createAnimeItems(response) {
    resultHTML = ""
    items = Object.values(response["items"])

    res = true;
    for (i = 0; i < items.length; i++) {
        res = res && createHistoryAnimeItem(items[i]);
    }

    if (res) {
        document.getElementById("itemsLoadingAlert").className = "d-none";
    } else {
        document.getElementById("itemsLoadingAlert").className = "alert alert-warning";
    }

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}