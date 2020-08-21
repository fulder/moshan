const urlParams = new URLSearchParams(window.location.search);
totalPages = 0;

id = urlParams.get("id")
mal_id = urlParams.get("mal_id")

episodePage = urlParams.get("episode_page")
if (episodePage === null) {
    episodePage = 1
} else {
    episodePage = parseInt(episodePage);
}

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
    if ("end_date" in anime && anime["end_date"] !== null) {
        status = "Finished"
    }

    resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${poster}" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${anime['title']}</h5>
            <p><b>Released</b>: ${anime['start_date']}</p>
            <p><b>Status</b>: ${status}</p>
            <button id="addButton" class="btn btn-success" onclick="addItem('anime', ${anime['mal_id']}, itemAdded)"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger d-none" onclick="removeItem('anime', '${anime['id']}', itemRemoved)"><i class="fa fa-minus"></i> Remove</button>
        </div>

        <div class="col-md-3 col-7">
            <div class="card mt-2">
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-4">
                            <a href="https://myanimelist.net/anime/${anime['mal_id']}" target="_blank"><img class="img-fluid" src="/includes/icons/mal.png" /></a>
                        </div>
                        <div id="anidbLink" class="col-4 d-none">
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
           <nav aria-label="Episode navigation">
               <ul id="episodesPages" class="pagination pagination-sm flex-wrap"></ul>
           </nav>
           <table id="episodesTable" class="table table-striped table-hover"></table>
       </div>
    `;

    document.getElementById("anime").innerHTML = resultHTML

    if ("anidb_id" in anime) {
        document.getElementById("anidbLink").classList.remove("d-none")
    }

    // if the anime item is cached
    if (id !== null) {
        // get item from watch history and toggle add/remove buttons
        getItem("anime", id, animeAdded);

        getAnimeEpisodes(id, createEpisodesList, episodePage);
        getEpisodes("anime", id, markAddedEpisodes);
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
                <th scope="col" class="episode-number-header small">#</th>
                <th scope="col" class="episode-add-header small">+/-</th>
                <th scope="col" class="small">Title</th>
                <th scope="col" class="episode-date-header small">Date</th>
            </tr>
        </thead>
    `

    episodes["items"].forEach(function(episode) {
        episodeId = episode['id'];
        episodeNumber = episode['episode_number'];
        episodeDate = episode['air_date'];
        episodeAired = Date.parse(episodeDate) <= (new Date()).getTime();

        if (!episodeAired) {
            tableHTML += `
                <tr class="bg-secondary">
                    <td class="small">${episodeNumber}</td>
                    <td class="small">
                        <button type="button" class="btn btn-success btn-sm disabled"><i class="fa fa-plus"></i></button>
                    </td>
                    <td class="text-truncate small">${episode['title']}</td>
                    <td class="small">${episodeDate}</td>
                </tr>
            `
        } else {
            tableHTML += `
                <tr>
                    <td class="small">${episodeNumber}</td>
                    <td class="small">
                        <button id="addEpisode-${episodeId}" type="button" class="btn btn-success btn-sm" onclick="addEpisodeWrapper('${episodeId}')"><i class="fa fa-plus"></i></button>
                        <button id="removeEpisode-${episodeId}" type="button" class="btn btn-danger btn-sm d-none" onclick="removeEpisodeWrapper('${episodeId}')"><i class="fa fa-minus"></i></button>
                    </td>
                    <td class="text-truncate small">${episode['title']}</td>
                    <td class="small">${episodeDate}</td>
                </tr>
            `
        }
    });

    document.getElementById("episodesTable").innerHTML = tableHTML

    if (document.getElementById("episodesPages").innerHTML === "") {
        paginationHTML = `<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadPreviousEpisodes()">Previous</a></li>`

        totalPages = episodes["total_pages"];
        for (i = 1; i <= totalPages; i++) {
            className = "page-item"
            if (i == episodePage) {
                className = "page-item active"
            }
            paginationHTML += `<li id="episodePage${i}" class="${className}"><a href="javascript:void(0)" class="page-link" onclick="loadEpisodes(${i})">${i}</a></li>`
        }
        paginationHTML += `<li class="page-item"><a href="javascript:void(0)" class="page-link" onclick="loadNextEpisodes()">Next</a></li>`

        document.getElementById("episodesPages").innerHTML = paginationHTML;
    }
}

function loadPreviousEpisodes() {
    if (episodePage > 1) {
        loadEpisodes(episodePage - 1)
    }
}

function loadNextEpisodes() {
    if (episodePage < totalPages) {
        loadEpisodes(episodePage + 1)
    }
}

function loadEpisodes(page) {
    if (episodePage == page) {
        return
    }
    document.getElementById("episodesPages").getElementsByTagName("LI")[episodePage].classList.remove("active");

    episodePage = page;
    getAnimeEpisodes(id, createEpisodesList, episodePage);

    document.getElementById("episodesPages").getElementsByTagName("LI")[episodePage].classList.add("active");

    urlParams.set("episode_page", page)
    history.pushState({}, null, `?${urlParams.toString()}`)
}

function addEpisodeWrapper(episodeId) {
    document.getElementById(`addEpisode-${episodeId}`).classList.add("d-none")
    document.getElementById(`removeEpisode-${episodeId}`).classList.remove("d-none")

    addEpisode("anime", id, episodeId)
}

function removeEpisodeWrapper(episodeId) {
    document.getElementById(`addEpisode-${episodeId}`).classList.remove("d-none")
    document.getElementById(`removeEpisode-${episodeId}`).classList.add("d-none")

    removeEpisode("anime", id, episodeId)
}

function markAddedEpisodes(userEpisodes) {
    console.log(userEpisodes);
}