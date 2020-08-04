const urlParams = new URLSearchParams(window.location.search);

mal_id = urlParams.get("mal_id")
if (mal_id !== null) {
    getAnimeByMalId(mal_id, createAnime)
}

function createAnime(anime) {
    poster = anime["main_picture"]["large"]
    title = anime["title"]

    resultHTML = '<div class="col-md-3 col-4 item">';
    resultHTML +='<img class="img-fluid" src=' + poster + '>';
    resultHTML += '<p class="text-truncate">' + title + '</p></img></div>';
    document.getElementById("anime").innerHTML = resultHTML

    console.log(anime);
}