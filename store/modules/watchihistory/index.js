import Vue from 'vue'
import Rx from 'rxjs/Rx'
import * as types from './types'

const api = 'http://localhost:8080'

const WatchHistoryModule = {
  namespaced: true,
  state: {
    movies: []
  },
  mutations: {
    [types.LOAD_MOVIES_REQUEST](state) {
    },
    [types.LOAD_MOVIES_SUCCESS](state, response) {
      state.movies = response.data
    }
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
          `https://localhost:8080/watch-history`,
          {
            header: {
              user_id: localStorage.getItem('user_id')
            }
          }
        )
        .then(response => {
          commit(types.LOAD_MOVIES_SUCCESS, response.data)
        });
    }
  }
}

export default WatchHistoryModule
