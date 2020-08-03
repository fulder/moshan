const urlParams = new URLSearchParams(window.location.search);

if ("mal_id" in urlParams) {
    getAnimeByMalId(urlParams["mal_id"], createAnime)
}

function createAnime(anime) {
    console.log(anime);
}