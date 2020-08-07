const urlParams = new URLSearchParams(window.location.search);
currentEpisodePage = 1;

id = urlParams.get("id")
mal_id = urlParams.get("mal_id")

if (id !== null){
    getAnimeById(id, createAnime);
}
else if (mal_id !== null) {
    getAnimeByApiId("mal_id", mal_id, createAnime);
}

function createAnime(anime) {
    if ("id" in anime) {
        id = anime["id"];
    }

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
           <table id="episodesTable" class="table table-striped table-hover"></table>
           <nav aria-label="Episode navigation">
               <ul id="episodesPages" class="pagination"></ul>
           </nav>
       </div>
    `;

    document.getElementById("anime").innerHTML = resultHTML

    if ("anidb_id" in anime) {
        document.getElementById("anidbLink").classList.remove("hidden")
    }


    // if the anime item is cached
    if (id !== undefined) {
        // get item from watch history and toggle add/remove buttons
        getItem("anime", id, animeAdded);

        getAnimeEpisodes(id, createEpisodesList);
    }
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
    tableHTML = `
        <thead>
            <tr>
                <th scope="col">Episode</th>
                <th scope="col">Title</th>
                <th scope="col">Air Date</th>
            </tr>
        </thead>
    `

    episodes["items"].forEach(function(episode) {
        tableHTML += `
            <tr>
                <td>${episode['episode_number']}</td>
                <td>${episode['title']}</td>
                <td>${episode['air_date']}</td>
            </tr>
        `
    });

    document.getElementById("episodesTable").innerHTML = tableHTML

    if (document.getElementById("episodesPages").innerHTML === "") {
        paginationHTML = `<li class="page-item"><a href="#" class="page-link" onclick="loadPreviousEpisodes()">Previous</a></li>`
        for (i = 1; i <= episodes["total_pages"]; i++) {
            paginationHTML += `<li id="episodePage${i}" class="page-item"><a href="#" class="page-link" onclick="loadEpisodes(${i})">${i}</a></li>`
        }
        paginationHTML += `<li class="page-item"><a href="#" class="page-link" onclick="loadNextEpisodes()">Next</a></li>`

        document.getElementById("episodesPages").innerHTML = paginationHTML;
        document.getElementById("episodesPages").getElementsByTagName("LI")[currentEpisodePage].classList.add("active");
    }
}

function loadPreviousEpisodes() {
    if (currentEpisodePage > 1) {
        loadEpisodes(currentEpisodePage - 1)
    }
}

function loadNextEpisodes() {
    if (currentEpisodePage < document.getElementById("episodesPages").getElementsByTagName("LI").length) {
        loadEpisodes(currentEpisodePage + 1)
    }
}

function loadEpisodes(page) {
    document.getElementById("episodesPages").getElementsByTagName("LI")[currentEpisodePage].classList.remove("active");

    currentEpisodePage = page;
    getAnimeEpisodes(id, createEpisodesList, currentEpisodePage);

    document.getElementById("episodesPages").getElementsByTagName("LI")[currentEpisodePage].classList.add("active");
}