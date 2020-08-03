//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
var includes = document.querySelectorAll('[data-include]');

includes.forEach(async function(includeDiv){
  console.log(includeDiv);
  var file = '/includes/html/' + includeDiv["data-include"] + '.html';
  fileContent = await axios.get(file);
  includeDiv.innerHtml = fileContent;
});

