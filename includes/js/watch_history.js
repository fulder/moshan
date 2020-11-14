if (accessToken === null) {
    document.getElementById("logInAlert").className = "alert alert-danger";
}
else {
    document.getElementById("logInAlert").className = "d-none";
    document.getElementById("animeWatchHistory").innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>'
}

getWatchHistoryByCollection("anime").then(function (response) {
    createAnimeItems(response.data)
}).catch(function (error) {
    console.log(error);
});

function createAnimeItems(response) {
    resultHTML = ""

    res = true;
    for (const [animeId, anime] of Object.entries(response["items"])) {
        itemCreated = createHistoryAnimeItem(animeId, anime)
        res = res && itemCreated;
    }

    if (res) {
        document.getElementById("itemsLoadingAlert").className = "d-none";
    } else {
        document.getElementById("itemsLoadingAlert").className = "alert alert-warning";
    }

    document.getElementById("animeWatchHistory").innerHTML = resultHTML
}

function createHistoryAnimeItem(animeId, anime) {
    if (!("title" in anime) || !("main_picture" in anime)) {
        return false;
    }

    title = anime["title"];
    poster = anime["main_picture"]["medium"];

    resultHTML += `<div id="poster-anime-${animeId}" class="col-4 col-md-2 poster">`;
    resultHTML += `<a href="/anime?id=${animeId}">`;
    resultHTML += `<img class="img-fluid" src="${poster}">`;
    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>';
    resultHTML += '</a>';

    return true;
}