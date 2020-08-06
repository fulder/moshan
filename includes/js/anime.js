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

    resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${poster}" />
        </div>

        <div class="col-md-9 col-7">
            <p><b>Released</b>: ${anime['start_date']}</p>
            <p><b>Status</b>: ${status}</p>
            <button id="addButton" class="btn btn-success" onclick="addItem('anime', ${anime['mal_id']}, itemAdded)">Add</button>
            <button id="removeButton" class="btn btn-danger d-none" onclick="removeItem('anime', '${anime['id']}', itemRemoved)">Remove</button>
        </div>

        <div class="col-md-3 col-7">
            <div class="card mt-2">
                <div class="card-header small">External Links</div>
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-4">
                            <a href="https://myanimelist.net/anime/${anime['mal_id']}" target="_blank"><img class="img-fluid" src="/includes/icons/mal.png" /></a>
                        </div>
                        <div id="anidbLink" class="col-4 hidden">
                            <a href="https://anidb.net/anime/${anime['anidb_id']}" target="_blank"><img class="img-fluid" src="/includes/icons/anidb.png" /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="synopsisCol" class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${anime['synopsis']}</div>
                </div>
            </div>
       </div>

       <div class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${anime['synopsis']}</div>
                </div>
            </div>
       </div>
    `;

    document.getElementById("anime").innerHTML = resultHTML

    if ("anidb_id" in anime) {
        document.getElementById("anidbLink").classList.remove("hidden")
    }

    // get item from watch history and toggle add/remove buttons
    getItem("anime", anime["id"], animeAdded);

    getAnimeEpisodes(anime["id"], createEpisodesList);
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

function createEpisodesList(episodes) {
    console.log(episodes);
}