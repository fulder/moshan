function searchAnime(searchString, callback) {
    axios.get("https://api.anime.moshan.tv/v1/anime?search=" + searchString)
      .then(function (response) {
        animes = JSON.parse(response);
        callback(animes);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}