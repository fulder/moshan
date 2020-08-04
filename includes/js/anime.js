const urlParams = new URLSearchParams(window.location.search);

mal_id = urlParams.get("mal_id")
if (mal_id !== null) {
    resultHTML = ""
    getAnimeByMalId(mal_id, createAnime)
    document.getElementById("anime").innerHTML = resultHTML
}

function createAnime(anime) {
    poster = anime["main_picture"]["large"]

    resultHTML += '<div class="col-2 item">';
    resultHTML +='<img class="img-fluid" src=' + poster + '>';
    resultHTML += '<p class="text-truncate">' + title + '</p></img></div>';

    console.log(anime);
}