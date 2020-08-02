//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
$(function(){
    var path = document.location.pathname;

    console.log(document.currentScript);

    var includes = $('[data-include]');
    jQuery.each(includes, function(){
      var file = directory + 'includes/html/' + $(this).data('include') + '.html';
      $(this).load(file);
    });
});
