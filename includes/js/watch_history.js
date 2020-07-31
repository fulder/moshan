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

function createHistoryAnimeItem(anime) {
    if (!("title" in anime) || !("main_picture" in anime)) {
        return false;
    }

    title = anime["title"];
    poster = anime["main_picture"]["medium"];
    animeId = anime["id"];

    resultHTML += '<div class="col-4 col-md-1 poster mx-md-1 px-md-1">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'

    resultHTML +='<button class="btn btn-sm btn-danger d-inline" data-toggle="modal" data-target="#exampleModal"><i class="fas fa-minus fa-xs"></i></button>'

    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'

    return true;
}