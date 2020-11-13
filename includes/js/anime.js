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

if (id !== null) {
    animeRequest = getAnimeById(id);
    animeEpisodesRequest = getAnimeEpisodes(id, episodePage);
    watchHistoryRequest = getWatchHistoryItem("anime", id);
    requests = [animeRequest, animeEpisodesRequest, watchHistoryRequest];
} else if (mal_id !== null) {
    animeRequest = getAnimeByApiId("mal", mal_id);
    requests = [animeRequest]
}

axios.all(requests).then(axios.spread((...responses) => {
  animeItem = responses[0].data
  animeEpisodes = null;
  watchHistoryItem = null;

  if (responses.length > 1) {
    animeEpisodes = responses[1].data
    watchHistoryItem = responses[2].data

    animeId = animeItem["id"]
  }

  createAnime(animeItem, watchHistoryItem)

  if (animeEpisodes !== null) {
    createEpisodesList(animeEpisodes)
   }
})).catch(errors => {
  console.log(errors)
})

function createAnime(animeItem, watchHistoryItem) {
    itemAdded = watchHistoryItem !== null

    status = "Airing"
    if ("end_date" in anime && anime["end_date"] !== null) {
        status = "Finished"
    }

    resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="${animeItem['main_picture']['large']}" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${animeItem['title']}</h5>
            <b>Released</b>: ${animeItem['start_date']}<br>
            <b>Status</b>: ${status}
             <div class="card mt-2 col-7 col-md-3">
                <div class="card-header">Links</div>
                <div class="card-body p-1">
                    <div class="row">
                        <div class="col-6 col-md-5">
                            <a href="https://myanimelist.net/anime/${animeItem['mal_id']}" target="_blank"><img class="img-fluid" src="/includes/icons/mal.png" /></a>
                        </div>
                        <div id="anidbLink" class="col-6 col-md-5 d-none">
                            <a href="https://anidb.net/anime/${animeItem['anidb_id']}" target="_blank"><img class="img-fluid" src="/includes/icons/anidb.png" /></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-3 col-7 mt-1">
            <button id="addButton" class="btn btn-success ${itemAdded ? 'd-none' : ''}" onclick="addItem('anime', ${animeItem['mal_id']}, itemAdded)"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger ${!itemAdded ? 'd-none' : ''}" onclick="removeWatchHistoryItem('anime', '${animeItem['id']}', itemRemoved)"><i class="fa fa-minus"></i> Remove</button>
        </div>

        <div id="synopsisCol" class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${animeItem['synopsis']}</div>
                </div>
            </div>
       </div>
    `;

    document.getElementById("anime").innerHTML = resultHTML

    if ("anidb_id" in animeItem) {
        document.getElementById("anidbLink").classList.remove("d-none")
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
    tableHTML = ''
    episodes["items"].forEach(function(episode) {
        episodeId = episode['id'];
        episodeNumber = episode['episode_number'];
        episodeDate = episode['air_date'];
        episodeAired = Date.parse(episodeDate) <= (new Date()).getTime();

        rowClass = "episodeRow"
        onClickAction = `window.location='/episode?collection_name=anime&id=${animeId}&episode_id=${episodeId}'`
        if (!episodeAired) {
            rowClass = "bg-secondary"
            onClickAction = ""
        }

        tableHTML += `
            <tr onclick="${onClickAction}" class=${rowClass}>
                <td class="small">${episodeNumber}</td>
                <td class="text-truncate small">${episode['title']}</td>
                <td class="small">${episodeDate}</td>
            </tr>
        `
    });

    document.getElementById("episodeTableBody").innerHTML = tableHTML

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
    getAnimeEpisodes(id, episodePage).then(function (response) {
        createEpisodesList(response.data);
    }).catch(function (error) {
        console.log(error);
    });

    document.getElementById("episodesPages").getElementsByTagName("LI")[episodePage].classList.add("active");

    urlParams.set("episode_page", page)
    history.pushState({}, null, `?${urlParams.toString()}`)
}