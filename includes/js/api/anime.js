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

function getAnimeByApiId(apiName, id) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime?${apiName}_id=${id}`, options)
}

function getAnimeById(id) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime/${id}`, options)
}

function getAnimeEpisodes(id, start=1, limit=100) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime/${id}/episodes?limit=${limit}&start=${start}`, options)
}

function getAnimeEpisode(id, episodeId) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime/${id}/episode/${episodeId}`, options)
}