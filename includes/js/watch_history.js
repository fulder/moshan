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
    for (const [animeId, anime] of Object.entries(object1)) {
        itemCreated = createHistoryAnimeItem(animeId, anime)
        res = res && itemCreated;
    }

    if (res) {
        document.getElementById("itemsLoadingAlert").className = "d-none";
    } else {
        document.getElementById("itemsLoadingAlert").className = "alert alert-warning";
    }

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}

function createHistoryAnimeItem(animeId, anime) {
    if (!("title" in anime) || !("main_picture" in anime)) {
        return false;
    }

    title = anime["title"];
    poster = anime["main_picture"]["medium"];

    console.log(anime);

    resultHTML += '<div class="col-4 col-md-1 poster mx-md-1 px-md-1">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'

    resultHTML +='<button class="btn btn-sm btn-danger d-inline" onclick="showConfirmationModal(\"anime\", ' + animeId + ', \"' + title + '\")"><i class="fas fa-minus fa-xs"></i></button>'

    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'

    return true;
}

function showConfirmationModal(collectionName, id, title) {
    removeCollectionName = collectionName
    removeId = id;

    $('removeModalBodyTitle').innerHTML = title
    $('#removalConfirmationModal').modal(show = true)

}

function removeFromWatchHistory() {
    removeItem(removeCollectionName, removeId);

    // Cleanup
    removeCollectionName = "";
    removeId = "";
}