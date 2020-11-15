const animeAxios = axios.create({
    baseURL: 'https://api.anime.moshan.tv/v1',
    headers: {
      'Content-Type': "application/json"
    }
})

function searchAnime(searchString) {
    return animeAxios.get(`/anime?search=${searchString}`)
}

function getAnimeByApiId(apiName, id) {
    return axios.get(`/anime?${apiName}_id=${id}`)
}

function getAnimeById(id) {
    return axios.get(`/anime/${id}`, options)
}

function getAnimeEpisodes(id, start=1, limit=100) {
    return axios.get(`/anime/${id}/episodes?limit=${limit}&start=${start}`)
}

function getAnimeEpisode(id, episodeId) {
    return axios.get(`/anime/${id}/episode/${episodeId}`)
}