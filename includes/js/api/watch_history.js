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

function getWatchHistoryByCollection(collectionName, callback) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName,
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

function removeItem(collection, id) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collection + '/' + id,
        type: "delete",
        headers: {
            'Authorization': accessToken
        },
        error:function(response) {
            console.log(response);
        },
    });
}

function addItem(collectionName, id) {
    $.ajax({
        url: "https://api.watch-history.moshan.tv/v1/watch-history/collection/" + collectionName,
        type: "post",
        contentType: 'application/json',
        dataType: "json",
        data: JSON.stringify({
            item_add_id: id
        }),
        headers: {
            'Authorization': accessToken
        },
        error:function(response) {
            console.log(response);
        },
    });
}