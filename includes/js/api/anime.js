const animeAxios = axios.create({
    baseURL: 'https://api.anime.moshan.tv/v1',
    headers: {
      'Content-Type': "application/json"
    }
})

animeAxios.interceptors.request.use(async function (config) {
    await checkToken();
    config.headers["Authorization"] = accessToken;
    return config;
}, function (error) {
    console.log(error);
    return Promise.reject(error);
});

function searchAnime(searchString) {
    return animeAxios.get(`/anime?search=${searchString}`)
}

function getAnimeByApiId(apiName, id) {
    return animeAxios.get(`/anime?${apiName}_id=${id}`)
}

function getAnimeById(id) {
    return animeAxios.get(`/anime/${id}`)
}

function getAnimeEpisodes(id, start=1, limit=100) {
    return animeAxios.get(`/anime/${id}/episodes?limit=${limit}&start=${start}`)
}

function getAnimeEpisode(id, episodeId) {
    return animeAxios.get(`/anime/${id}/episode/${episodeId}`)
}