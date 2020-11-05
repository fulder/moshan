options = {
    headers: {
        'Authorization': accessToken,
        'Content-Type': "application/json"
    }
}

function searchAnime(searchString, callback) {
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
    return axios.get(`https://api.anime.moshan.tv/v1/anime?${apiName}=${id}`, options)
}

function getAnimeById(id) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime/${id}`, options)
}

function getAnimeEpisodes(id, callback, start=1, limit=100) {
    axios.get(`https://api.anime.moshan.tv/v1/anime/${id}/episodes?limit=${limit}&start=${start}`, options)
      .then(function (response) {
        callback(response.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
}

function getAnimeEpisode(id, episodeId) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime/${id}/episode/{episodeId}`, options)
}