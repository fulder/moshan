import Vue from 'vue'
import Vuex from 'vuex'
import StartPageModule from './modules/startpage'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

function storeFactory() {
  return new Vuex.Store({
    modules: {
      'startPageModule': StartPageModule
    },
    strict: debug
  })
}

export default storeFactory
