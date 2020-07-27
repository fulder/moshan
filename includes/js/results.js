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
        const animeResults = document.getElementById("animeResults")
        animeResults.innerText = response
    },
});


