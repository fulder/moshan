function getWatchHistory() {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history",
        type: "get",
        headers: {
            'Authorization': accessToken
        },
        success:function(response) {
            watchHistory = JSON.parse(response);
        },
    });
}

function getWatchHistoryByCollection(collection, callback) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collection,
        type: "get",
        headers: {
            'Authorization': accessToken
        },
        success:function(response) {
            response = JSON.parse(response);
            callback(response)
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