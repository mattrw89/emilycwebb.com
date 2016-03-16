console.log('JS exec start', (new Date).toISOString());
var onLoadTimeout = setTimeout(function() {
  onLoadFn();
}, 4000);

function getPageParams() {
  var params = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value){
    params[key] = value;
  });
  return params;
}

var pageParams = getPageParams();

var onLoadFn = function() {
  console.log('onLoadFn fired', (new Date).toISOString());

  $('.lazy_load').trigger('window-load');
  clearTimeout(onLoadTimeout);
};

$(window).load(function() {
  onLoadFn();
});


$(document).ready(function() {
  console.log('document.ready!', (new Date).toISOString());

  $('.lazy_load').lazyload({
    event: 'window-load'
  });

});