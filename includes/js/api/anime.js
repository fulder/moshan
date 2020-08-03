function searchAnime(searchString, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get("https://api.anime.moshan.tv/v1/anime?search=" + searchString, options)
      .then(function (response) {
        animes = JSON.parse(response.data);
        callback(animes);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}