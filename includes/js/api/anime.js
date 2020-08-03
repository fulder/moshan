function searchAnime(searchString, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.anime.moshan.tv/v1/anime?search=${searchString}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getAnimeByMalId(malId, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.anime.moshan.tv/v1/anime?mal_id=${malId}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}