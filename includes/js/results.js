const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');
getWatchHistory();

searchAnime(searchString, callback);

function callback() {
    resultHTML = ""
    idMap = animes["id_map"]
    animes["items"].forEach(createResultItem);

    document.getElementById("animeResults").innerHTML = resultHTML
}
