const urlParams = new URLSearchParams(window.location.search);
const searchString = urlParams.get('search');
accessToken = localStorage.getItem("moshan_access_token")

$.ajax({
    url: "https://api.anime.moshan.tv/v1/anime?search=" + searchString,
    type: "get",
    headers: {
        'Authorization': accessToken
    },
    success:function(response) {
        animes = JSON.parse(response);

        resultHTML = ""
        animes["items"].forEach(createResultItem);

        document.getElementById("animeResults").innerHTML = resultHTML
    },
});


function createResultItem(anime) {
    title = anime["title"];
    poster = anime["main_picture"]["medium"];

    if (title.length > 15) {
        title = title.substring(0, 15) + "..."
    }
    resultHTML += '<div class="col-4 col-md-2" ><img class="img-fluid" src=' + poster + ' /><p>' + title + '</p></div>'
}