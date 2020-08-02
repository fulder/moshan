//See: https://stackoverflow.com/a/31837264. Automated loading of html using "data-include" html tag
$(function(){
    var path = window.location.pathname;

    goBackFolders = window.location.pathname.split("/").length-2;

    var includes = $('[data-include]');
    jQuery.each(includes, function(){
      var file = "../".repeat(goBackFolders) + 'includes/html/' + $(this).data('include') + '.html';
      $(this).load(file);
    });
});
