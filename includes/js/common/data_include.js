//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
$(function(){
    var path = document.location.pathname;

    // https://stackoverflow.com/a/2161748
    var scripts= document.getElementsByTagName('script');
    var path= scripts[scripts.length-1].src
    var scriptDir= path.split('/').slice(0, -1).join('/')+'/';

    console.log(scriptDir);

    var includes = $('[data-include]');
    jQuery.each(includes, function(){
      var file = directory + 'includes/html/' + $(this).data('include') + '.html';
      $(this).load(file);
    });
});
