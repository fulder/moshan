const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');

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


function createResultItem(anime) {
    title = anime["title"];
    poster = anime["main_picture"]["medium"];
    animeId = anime["id"];

    resultHTML += '<div class="col-4 col-md-1 poster mx-md-1 px-md-1">'
    resultHTML +='<img class="img-fluid" src=' + poster + '>'

    // If the item is found in the idMap (i.e. the item is cache'd in moshan anime db)
    // and if it is added to the user watch history, set the button to removeAnime button
    // otherwise create the addAnime button
    if (idMap[animeId] !== undefined && watchHistory["items"].find(item => item["collection_name"] == "anime" && item["item_id"] == idMap[animeId]) !== undefined) {
        resultHTML +='<button id="removeAnimeButton-' + animeId '" class="btn btn-sm btn-danger" onclick="removeAnime(' + idMap[animeId] + ')"><i class="fas fa-minus fa-xs"></i></button>'
    } else {
        resultHTML +='<button id="addAnimeButton-' + animeId '" class="btn btn-sm btn-success" onclick="addAnime(' + animeId + ')"><i class="fas fa-plus fa-xs"></i></button>'
    }
    resultHTML += '<p class="text-truncate small">' + title + '</p></img></div>'
}