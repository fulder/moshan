const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');
getWatchHistory();

$.ajax({
    url: "https://api.anime.moshan.tv/v1/anime?search=" + searchString,
    type: "get",
    headers: {
        'Authorization': accessToken
    },
    success:function(response) {
        animes = JSON.parse(response);

        resultHTML = ""
        idMap = animes["id_map"]
        animes["items"].forEach(createResultItem);

        document.getElementById("animeResults").innerHTML = resultHTML
    },
});

