const urlParams = new URLSearchParams(window.location.search);

id = urlParams.get("id")
mal_id = urlParams.get("mal_id")

if (id !== null){
    getAnimeById(id, createAnime)
}
else if (mal_id !== null) {
    getAnimeByApiId("mal_id", mal_id, createAnime)
}


function createAnime(anime) {
    poster = anime["main_picture"]["large"]
    title = anime["title"]
    synopsis = anime["synopsis"]

    document.getElementById("title").innerHTML = title

    resultHTML = '<div class="col-md-3 col-4 item">';
    resultHTML += `<img class="img-fluid" src="${poster}" />`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-2 col-3">';
    resultHTML += `<p>${synopsis}</p>`;
    resultHTML += '</div>';
    document.getElementById("anime").innerHTML = resultHTML

    console.log(anime);
}