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
    start_date = anime["start_date"]
    synopsis = anime["synopsis"]

    status = "Airing"
    if ("end_date" in $anime) {
        status = "Finished"
    }


    document.getElementById("title").innerHTML = anime['title']

    resultHTML = '<div class="col-md-3 col-4 item">';
    resultHTML += `<img class="img-fluid" src="${poster}" />`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-9 col-8">';
    resultHTML += `<p><b>Release date</b>: ${start_date}</p>`;
    resultHTML += `<p><b>Status</b>: ${status}</p>`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-9 col-12">';
    resultHTML += `<p>${synopsis}</p>`;
    resultHTML += '</div>';
    document.getElementById("anime").innerHTML = resultHTML

    console.log(anime);
}