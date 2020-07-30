const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');
getWatchHistory();

document.getElementById("animeResults").innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>'

searchAnime(searchString, callback);

function callback() {
    resultHTML = ""
    idMap = animes["id_map"]
    animes["items"].forEach(createResultItem);

    document.getElementById("animeResults").innerHTML = resultHTML
}
