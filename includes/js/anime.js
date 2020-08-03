const urlParams = new URLSearchParams(queryString);

if ("mal_id" in urlParams) {
    getAnimeByMalId(urlParams["mal_id"], createAnime)
}

function createAnime(anime) {
    console.log(anime);
}