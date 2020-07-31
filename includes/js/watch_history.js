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
        itemCreated = createHistoryAnimeItem(items[i])
        res = res && itemCreated;
    }

    if (res) {
        document.getElementById("itemsLoadingAlert").className = "d-none";
    } else {
        document.getElementById("itemsLoadingAlert").className = "alert alert-warning";
    }

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}