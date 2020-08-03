const urlParams = new URLSearchParams(window.location.search);

mal_id = urlParams.get("mal_id")
if (mal_id !== null) {
    getAnimeByMalId(urlParams["mal_id"], createAnime)
}

function createAnime(anime) {
    console.log(anime);
}