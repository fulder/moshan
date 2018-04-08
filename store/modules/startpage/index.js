import Vue from 'vue'
import Rx from 'rxjs/Rx'
import * as types from './types'

const api = 'http://localhost:8080'

const StartPageModule = {
  namespaced: true,
  state: {
    movies: [],
    filteredMovies: [],
    currentPageLoaded: 1,
    programs: [],
    error: {}
  },
  mutations: {
    [types.LOAD_MOVIES_REQUEST](state) {
      state.courses = []
      state.error = {}
    },
    [types.LOAD_MOVIES_SUCCESS](state, data) {
      state.movies = data.results
      state.filteredMovies = data.results
    },
    [types.LOAD_MORE_MOVIES_SUCCESS](state, data) {
      state.movies = state.movies.concat(data.results);
      state.filteredMovies = state.filteredMovies.concat(
        data.results
      );
      state.currentPageLoaded++;
    },
    [types.SET_CURRENT_PAGE](state, pageNumber) {
      state.currentPageLoaded = pageNumber
    },

  },
  actions: {
    loadCourseManagerPage(store) {
      const calls = Rx.Observable.forkJoin(
        Rx.Observable.from(store.dispatch('loadMovies')),
        Rx.Observable.from(store.dispatch('loadPrograms')),
        Rx.Observable.from(store.dispatch('userModule/loadUserDetails', null, { root: true })),
        Rx.Observable.from(store.dispatch('appsModule/loadCustomer', null, { root: true }))
      )
      store.dispatch('startLoading', calls)
      calls.subscribe()
    },
    loadMovies({ commit, state }) {
      console.log('loading movies')
      commit(types.LOAD_MOVIES_REQUEST)
      Vue.axios
        .get(
          'http://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc',
          {
            params: {
              api_key: '667cd61fb50d8c5fff3ac5f37fd760b7'
            }
          }
        )
        .then(response => {
          commit(types.LOAD_MOVIES_SUCCESS, response.data)
        });
    },
    loadMoreMovies({ commit, state }) {
      Vue.axios
        .get(
          `http://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&page=${state.currentPageLoaded + 1}`,
          {
            params: {
              api_key: '667cd61fb50d8c5fff3ac5f37fd760b7'
            }
          }
        )
        .then(response => {
          commit(types.LOAD_MORE_MOVIES_SUCCESS, response.data)
        });
    },
    addMovie({ commit, state }, movieId) {
      const userId = localStorage.getItem('user_id')
      Vue.axios
        .post(`http://localhost:8080/${userId}/watch-history/${movieId}`, {}, { headers: { user_id: userId } })
        .then(response => console.log('response', response))
        .catch(error => console.log('error', error));
    },
    setCurrentPageLoaded({ commit, state }, pageNumber) {
      commit(this.SET_CURRENT_PAGE, pageNumber)
    }
  }
}

export default StartPageModule
