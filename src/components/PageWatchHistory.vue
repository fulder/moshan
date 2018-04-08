<template>
  <v-layout v-scroll="onScroll" mt-5>
    <v-flex xs12 sm8 offset-sm2>
      MVOIES
      {{movies}}

      <v-list two-line>
          <div v-for="item in movies" v-bind:key="item.movie_id">
            <v-subheader v-text="item.movie_id"></v-subheader>
            <v-divider></v-divider>
            <v-list-tile avatar>
              <v-list-tile-avatar>
                <img src="https://i.imgur.com/eXDlxYd.jpg">
              </v-list-tile-avatar>
            </v-list-tile>
          </div>
        </v-list>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'page-watch-history',
  data() {
    return {
    }
  },
  created() {
    this.loadWatchHistory()
  },
  methods: {
    loadWatchHistory() {
      Vue.axios
        .get(`http://localhost:5000/watch-history`)
        .then(response => {
          console.log('response', response)
          this.movies = response.data
        })
    }
  }
}
</script>

<style scoped>
</style>
