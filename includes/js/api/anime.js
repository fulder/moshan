options = {
    headers: {
        'Authorization': accessToken,
        'Content-Type': "application/json"
    }
}

function searchAnime(searchString) {
    return axios.get(`https://api.anime.moshan.tv/v1/anime?search=${searchString}`, options)
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