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

    status = "Airing"
    if ("end_date" in anime) {
        status = "Finished"
    }


    document.getElementById("title").innerHTML = anime['title']

    resultHTML = '<div class="col-md-3 col-5 item">';
    resultHTML += `<img class="img-fluid" src="${poster}" />`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-2 col-6">';
    resultHTML += `<p><b>Date</b>: ${anime['start_date']}</p>`;
    resultHTML += `<p><b>Status</b>: ${status}</p>`;
    resultHTML += `<button class="btn btn-success">Add</button>`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-9 col-12">';
    resultHTML += `<p id="synopsis">${anime['synopsis']}</p>`;
    resultHTML += `<a class="collapsed" data-toggle="collapse" href="#synopsis" aria-expanded="false" aria-controls="collapse"></a>`
    resultHTML += '</div>';

    document.getElementById("anime").innerHTML = resultHTML

    console.log(anime);
}