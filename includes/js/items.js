function addAnime(malId) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/anime",
        type: "post",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({
            item_add_id: malId
        }),
        headers: {
            'Authorization': accessToken
        },
        error:function(response) {
            console.log(response);
        },
    });
}

function removeAnime(animeId) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/anime/" + animeId,
        type: "delete",
        headers: {
            'Authorization': accessToken
        },
        error:function(response) {
            console.log(response);
        },
    });
}