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

    resultHTML = '<div class="col-md-5 col-5 item">';
    resultHTML += `<img class="img-fluid" src="${poster}" />`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-5 col-6">';
    resultHTML += `<p><b>Start Date</b>: ${anime['start_date']}</p>`;
    resultHTML += `<p><b>Status</b>: ${status}</p>`;
    resultHTML += `<button class="btn btn-success">Add</button>`;
    resultHTML += `<button class="btn btn-danger d-none">Remove</button>`;
    resultHTML += '</div>';

    resultHTML += '<div id="synopsisCol" class="col-md-9 col-12">';
    resultHTML += '<div class="card">';
    resultHTML += '<div id="synopsisCardHeader" class="card-header">';
    resultHTML += `<button class="btn btn-link" data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseOne">Synopsis</button>`;
    resultHTML += '<div id="collapseSynopsis" class="collapse show" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">'
    resultHTML += `<div class="card-body">`;
    resultHTML += anime['synopsis']
    resultHTML += '</div>';
    resultHTML += '</div>';
    resultHTML += '</div>';



    document.getElementById("anime").innerHTML = resultHTML

    console.log(anime);
}
