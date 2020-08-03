//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
var includes = $('[data-include]');
jQuery.each(includes, function(){
  var file = '/includes/html/' + $(this).data('include') + '.html';
  $(this).load(file);
});

