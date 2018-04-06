<template>
  <v-layout v-scroll="onScroll" mt-5>
    <v-flex xs12 sm8 offset-sm2>
      <v-btn @click.native="login()" color="success">Login</v-btn>
      <v-btn @click.native="checkToken()" color="success">Check Token</v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import Vue from 'vue';

export default {
  name: 'page-login',

  methods: {
    login() {
      Vue.axios.get(`http://localhost:8080/login`).then(response => {
        console.log('response', response);
        localStorage.setItem('user_id', response.data);
      });
    },
    checkToken() {
      Vue.axios
        .get(`http://localhost:8080/movies`, {
          headers: {
            user_id: localStorage.getItem('user_id')
              ? localStorage.getItem('user_id')
              : ''
          }
        })
        .then(response => {
          console.log('response', response);
        });
    }
  }
};
</script>

<style scoped>

</style>
