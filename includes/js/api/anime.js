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

function getAnimeByApiId(apiName, id, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.anime.moshan.tv/v1/anime?${apiName}=${id}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}


function getAnimeById(id, callback) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.anime.moshan.tv/v1/anime/${id}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getAnimeEpisodes(id, callback, start=1, limit=100) {
    options = {
        headers: {
            'Authorization': accessToken,
            'Content-Type': "application/json"
        }
    }
    axios.get(`https://api.anime.moshan.tv/v1/anime/${id}/episodes?limit=${limit}&start=${start}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}