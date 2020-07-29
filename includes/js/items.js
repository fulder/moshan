function createHistoryAnimeItem(anime) {
    title = anime["title"];
    poster = anime["main_picture"]["medium"];
    animeId = anime["id"];

    resultHTML += '<div class="col-4 col-md-1 poster mx-md-1 px-md-1">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'

    resultHTML +='<button class="btn btn-sm btn-danger d-inline" onclick="removeAnime(' + animeId + ')"><i class="fas fa-minus fa-xs"></i></button>'

    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'
}

function createResultItem(anime) {
    title = anime["title"];
    poster = anime["main_picture"]["medium"];
    externalId = anime["id"];

    resultHTML += '<div class="col-4 col-md-1 poster mx-md-1 px-md-1">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'

    // If the item is found in the idMap (i.e. the item is cache'd in moshan anime db)
    // and if it is added to the user watch history, set the button to removeAnime button
    // otherwise create the addAnime button
    if (idMap[externalId] !== undefined && watchHistory["items"][idMap[externalId]] !== undefined) {
        resultHTML +='<button id="removeAnimeButton-' + externalId + '" class="btn btn-sm btn-danger d-inline" onclick="removeAnimeWrapper(' + externalId + ')"><i class="fas fa-minus fa-xs"></i></button>'
        resultHTML +='<button id="addAnimeButton-' + externalId + '" class="btn btn-sm btn-success d-none" onclick="addAnimeWrapper(' + externalId + ')"><i class="fas fa-plus fa-xs"></i></button>'
    } else {
        resultHTML +='<button id="removeAnimeButton-' + externalId + '" class="btn btn-sm btn-danger d-none" onclick="removeAnimeWrapper(' + externalId + ')"><i class="fas fa-minus fa-xs"></i></button>'
        resultHTML +='<button id="addAnimeButton-' + externalId + '" class="btn btn-sm btn-success d-inline" onclick="addAnimeWrapper(' + externalId + ')"><i class="fas fa-plus fa-xs"></i></button>'
    }
    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'
}

function addAnimeWrapper(externalId) {
    animeWrapper(externalId, "add")
}

function removeAnimeWrapper(externalId) {
    animeWrapper(externalId, "remove")
}

function animeWrapper(externalId, type) {
    addAnimeButton = document.getElementById("addAnimeButton-" + externalId)
    removeAnimeButton = document.getElementById("removeAnimeButton-" + externalId)

    if (type === "add") {
        addAnimeButton.className = "btn btn-sm btn-success d-none"
        removeAnimeButton.className = "btn btn-sm btn-danger d-inline"
        addAnime(externalId);
    }
    else if (type === "remove") {
        addAnimeButton.className = "btn btn-sm btn-success d-inline"
        removeAnimeButton.className = "btn btn-sm btn-danger d-none"
        removeAnime(idMap[externalId]);
    }
}