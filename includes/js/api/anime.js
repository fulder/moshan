function searchAnime(searchString, callback) {
    $.ajax({
        url: "https://api.anime.moshan.tv/v1/anime?search=" + searchString,
        type: "get",
        headers: {
            'Authorization': accessToken
        },
        success:function(response) {
            animes = JSON.parse(response);
            callback(animes);
        },
    });
}