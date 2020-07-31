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

    res = true;
    for (const [animeId, anime] of Object.entries(response["items"])) {
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

    resultHTML += `<div id="poster-anime-${animeId}" class="col-4 col-md-1 poster mx-md-1 px-md-1">`
    resultHTML += `<img class="img-fluid" src="${poster}">`

    resultHTML +=`<button class="btn btn-sm btn-danger d-inline" onclick="showConfirmationModal('anime', '${animeId}', '${title}')"><i class="fas fa-minus fa-xs"></i></button>`;

    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'

    return true;
}

function showConfirmationModal(collectionName, id, title) {
    removeCollectionName = collectionName
    removeId = id;

    $('#removeModalBodyTitle').html(title);
    $('#removalConfirmationModal').modal('show');
}

function removeFromWatchHistory() {
    removeItem(removeCollectionName, removeId);

    $('#removalConfirmationModal').modal('hide');
    $(`#poster-${removeCollectionName}-${removeId}`).remove();

    // Cleanup
    $('#removeModalBodyTitle').html("");
    removeCollectionName = "";
    removeId = "";
}