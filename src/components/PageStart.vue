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
              <v-flex xs3 v-for="movie in filteredMovies" v-bind:key="movie.id">
                <a :href="`https://www.themoviedb.org/movie/${movie.id}`">
                  <img :src="`http://image.tmdb.org/t/p/w200/${movie.poster_path}`" width="270px" height="400px" />
                </a>
                <v-btn color="primary" class="add-movie-button" @click.native="addMovie(movie.id)">Add</v-btn>
                <v-btn color="primary" class="add-movie-button" @click.native="addMovie(movie.id)">Remove</v-btn>
            </v-flex>
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
      searchString: ''
    };
  },
  created() {
    console.log('creatign');
    this.$store.dispatch('startPageModule/loadMovies');
  },
  watch: {
    searchString: function() {
      this.searchMovies();
    }
  },
  computed: {
    movies() {
      return this.$store.state.startPageModule.movies;
    },
    filteredMovies() {
      return this.$store.state.startPageModule.filteredMovies;
    },
    currentPageLoaded() {
      return this.$store.state.startPageModule.currentPageLoaded
    }
  },
  methods: {
    loadMore() {
      this.$store.dispatch('startPageModule/loadMoreMovies');
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
        .post(`http://localhost:8080/watch-history`, { movie_id: movieId }, {})
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

.add-movie-button {
}
</style>
