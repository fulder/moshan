const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');

if (accessToken === null) {
    document.getElementById("logInAlert").className = "alert alert-danger";
}
else {
    document.getElementById("logInAlert").className = "d-none";
    document.getElementById("animeResults").innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>'
}

searchAnime(searchString, callback);

function callback() {
    resultHTML = ""
    idMap = animes["id_map"]
    animes["items"].forEach(createResultAnimeItem);

    document.getElementById("animeResults").innerHTML = resultHTML
}

function createResultAnimeItem(anime) {
    title = anime["title"];
    poster = anime["main_picture"]["medium"];
    externalId = anime["id"];

    resultHTML += '<div class="col-4 col-md-1 mx-md-1 px-md-1 poster">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'
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
        addItem("anime", externalId);
    }
    else if (type === "remove") {
        addAnimeButton.className = "btn btn-sm btn-success d-inline"
        removeAnimeButton.className = "btn btn-sm btn-danger d-none"
        removeItem("anime", idMap[externalId]);
    }
}