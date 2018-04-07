<template>
  <v-layout v-scroll="onScroll" mt-5>
    <v-flex xs12 sm8 offset-sm2>
      <v-container fluid v-bind="{ [`grid-list-xs`]: true }">
        <v-layout row>
          <v-flex xs8 offset-xs2>
            <v-text-field name="input-2-3" label="Search" class="input-group--focused" v-model="searchString" single-line></v-text-field>
          </v-flex>
        </v-layout>
        <v-layout row wrap>
          <transition-group name="movie" tag="p">
            <span v-for="movie in filteredMovies" v-bind:key="movie.id" class="list-movie">
              <a :href="`https://www.themoviedb.org/movie/${movie.id}`">
                <img :src="`http://image.tmdb.org/t/p/w200/${movie.poster_path}`" width="270px" height="400px" />
              </a>
            </span>
          </transition-group>
        </v-layout>
      </v-container>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue';
import _ from 'lodash';

export default {
  name: 'page-start',
  data() {
    return {
      movies: [],
      currentPageLoaded: 1,
      searchString: '',
      filteredMovies: []
    };
  },
  created() {
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
        this.movies = response.data.results;
        this.filteredMovies = response.data.results;
      });
  },
  watch: {
    searchString: function() {
      this.searchMovies();
    }
  },
  methods: {
    loadMore() {
      Vue.axios
        .get(
          `http://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&page=${this
            .currentPageLoaded + 1}`,
          {
            params: {
              api_key: '667cd61fb50d8c5fff3ac5f37fd760b7'
            }
          }
        )
        .then(response => {
          this.movies = this.movies.concat(response.data.results);
          this.filteredMovies = this.filteredMovies.concat(
            response.data.results
          );
          this.currentPageLoaded++;
        });
    },
    onScroll() {
      let pos =
        (document.documentElement.scrollTop || document.body.scrollTop) +
        document.documentElement.offsetHeight;
      let max = document.documentElement.scrollHeight;
      if (pos >= max) {
        this.loadMore();
      }
    },
    addMovie(movieId) {
      Vue.axios
        .post(`http://localhost:5000/watch-history`, { movie_id: movieId }, {})
        .then(response => console.log('response', response))
        .catch(error => console.log('error', error));
    },
    searchMovies: _.debounce(function() {
      this.filteredMovies = this.movies.filter(movie =>
        movie.title.toLowerCase().includes(this.searchString)
      );
    }, 200)
  }
};
</script>

<style scoped>
img {
  object-fit: cover;
  margin: 0 4px;
}

.movie-enter-active {
  transition: all 1s;
}

.movie-leave-active {
  transition: all 0.2s;
}
.movie-enter,
.movie-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
