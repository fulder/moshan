//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
const axios = require('axios');

var includes = document.querySelectorAll('[data-include]');

includes.forEach(async function(includeDiv){
  var file = '/includes/html/' + includeDiv["data-include"] + '.html';
  fileContent = await axios.get(file);
  includeDiv.innerHtml = fileContent;
});

