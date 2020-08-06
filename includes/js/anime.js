const urlParams = new URLSearchParams(window.location.search);

id = urlParams.get("id")
mal_id = urlParams.get("mal_id")

if (id !== null){
    getAnimeById(id, createAnime);
}
else if (mal_id !== null) {
    getAnimeByApiId("mal_id", mal_id, createAnime);
}

function createAnime(anime) {
    poster = anime["main_picture"]["large"]
    console.log(anime);

    status = "Airing"
    if ("end_date" in anime) {
        status = "Finished"
    }


    document.getElementById("title").innerHTML = anime['title']

    resultHTML = '<div class="col-md-3 col-5 item">';
    resultHTML += `<img class="img-fluid" src="${poster}" />`;
    resultHTML += '</div>';

    resultHTML += '<div class="col-md-3 col-7">';
    resultHTML += `<p><b>Released</b>: ${anime['start_date']}</p>`;
    resultHTML += `<p><b>Status</b>: ${status}</p>`;

    resultHTML += `<button id="addButton" class="btn btn-success" onclick="addItem('anime', ${anime['mal_id']}, itemAdded)">Add</button>`;
    resultHTML += `<button id="removeButton" class="btn btn-danger d-none" onclick="removeItem('anime', '${anime['id']}', itemRemoved)">Remove</button>`;
    resultHTML += `<a href="https://myanimelist.net/anime/${anime['mal_id']}"><img class="img-fluid" src="/includes/icons/mal.png" /></a>`;
    resultHTML += '</div>';

    resultHTML += '<div id="synopsisCol" class="mt-2 col-12">';
    resultHTML += '<div class="card">';
    resultHTML += `<a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">`;
    resultHTML += '<div id="synopsisCardHeader" class="card-header">Synopsis</div>';
    resultHTML += '</a>';
    resultHTML += '<div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">'
    resultHTML += `<div class="card-body">`;
    resultHTML += anime['synopsis']
    resultHTML += '</div>';
    resultHTML += '</div>';

    document.getElementById("anime").innerHTML = resultHTML

    // get item from watch history and toggle add/remove buttons
    getItem("anime", anime["id"], animeAdded);
}

function itemAdded() {
    document.getElementById("addButton").classList.add("d-none");
    document.getElementById("removeButton").classList.remove("d-none");
}

function itemRemoved() {
    document.getElementById("addButton").classList.remove("d-none");
    document.getElementById("removeButton").classList.add("d-none");
}

function animeAdded(anime) {
    console.log(anime);

    if (anime === null) {
        itemRemoved();
    } else {
        itemAdded();
    }
}