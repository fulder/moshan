const urlParams = new URLSearchParams(window.location.search);

collectionName = urlParams.get("collection_name")
id = urlParams.get("id")
episodeId = urlParams.get("episode_id")

if (collectionName == "anime") {
    animeRequest = getAnimeEpisode(id, episodeId)
}
watchHistoryRequest = getWatchHistoryEpisode(collectionName, id, episodeId)

axios.all([animeRequest, watchHistoryRequest]).then(axios.spread((...responses) => {
  animeEpisode = responses[0].data
  watchHistoryEpisode = responses[1].data

  createEpisodePage(animeEpisode, watchHistoryEpisode)
})).catch(error  => {
  console.log(error)
})

function createEpisodePage(animeEpisode, watchHistoryEpisode) {
    console.log(animeEpisode)
    console.log(watchHistoryEpisode)

    episodeAdded = watchHistoryEpisode !== ""

    episodeAired = Date.parse(animeEpisode['air_date']) <= (new Date()).getTime();
    status = episodeAired ? "Aired" : "Not Aired"

    resultHTML = `
        <div class="col-md-3 col-5 item">
            <img class="img-fluid" src="/includes/img/image_not_available.png" />
        </div>

        <div class="col-md-9 col-7">
            <h5>${animeEpisode['title']}</h5>
            <p><b>Aired</b>: ${animeEpisode['air_date']}</p>
            <p><b>Status</b>: ${status}</p>
            <button id="addButton" class="btn btn-success ${!episodeAired || episodeAdded ? 'd-none' : ''}" onclick="addWatchHistoryEpisode('anime', ${animeEpisode['id']}, episodeAdded)"><i class="fa fa-plus"></i> Add</button>
            <button id="removeButton" class="btn btn-danger ${!episodeAired || !episodeAdded ? 'd-none' : ''}" onclick="removeWatchHistoryEpisode('anime', '${animeEpisode['id']}', episodeRemoved)"><i class="fa fa-minus"></i> Remove</button>
            <button class="btn btn-secondary ${!episodeAired ? '" disabled' : 'd-none"'}><i class="fa fa-plus"></i> Add</button>
            <input type="text" id="flatpickr">
        </div>

        <div id="synopsisCol" class="mt-2 col-12">
            <div class="card">
                <a data-toggle="collapse" data-target="#collapseSynopsis" aria-expanded="true" aria-controls="collapseSynopsis">
                    <div id="synopsisCardHeader" class="card-header">Synopsis</div>
                </a>
                <div id="collapseSynopsis" class="collapse" aria-labelledby="synopsisHeader" data-parent="#synopsisCol">
                    <div class="card-body">${animeEpisode['synopsis']}</div>
                </div>
            </div>
       </div>
    `;

    const fp = flatpickr("#flatpickr", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        locale: {
            firstDayOfWeek: 1 // start week on Monday
        },
        weekNumbers: true,
    });

    document.getElementById("episode").innerHTML = resultHTML
}