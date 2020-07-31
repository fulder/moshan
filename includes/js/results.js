const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');
getWatchHistory();

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
    animes["items"].forEach(createResultItem);

    document.getElementById("animeResults").innerHTML = resultHTML
}
