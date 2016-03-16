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

if (pageParams['referralId']) {
  // check if it meets the regex now
  var passesRegex = /^RA_[0-9]{8}$/im.test(pageParams['referralId']);
  if (passesRegex) {
    Cookies.set('referralId', pageParams['referralId']);
  }
}

var onLoadFn = function() {
  console.log('onLoadFn fired', (new Date).toISOString());

  $('.lazy_load').trigger('window-load');
  clearTimeout(onLoadTimeout);
};

$(window).load(function() {
  onLoadFn();
});


function setFlexVideoMaxHeight() {
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();

  if ((windowWidth / windowHeight) > (16/9.0)) {
    $('.video_overlay .flex-video iframe').css({
      'max-height': windowHeight * 0.9
    });
  } else {
    $('.video_overlay .flex-video iframe').css({
      'max-height': ''
    });
  }
};

$(document).ready(function() {
  console.log('document.ready!', (new Date).toISOString());

  $('.lazy_load').lazyload({
    event: 'window-load'
  });

  function initVimeoPromo() {
    $('.video_overlay.sa_promo .flex-video').empty();
    $('.video_overlay.sa_promo .flex-video').html('<iframe id="landing_sa_promo_player" src="https://player.vimeo.com/video/134850347?api=1&player_id=landing_sa_promo_player&badge=0&byline=0&title=0" width="500" height="281" frameborder="0" data-progress="true" data-seek="true" data-bounce="true" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    setFlexVideoMaxHeight();
  }

  function initVimeoTrim() {
    $('.video_overlay.sa_trim_video .flex-video').empty();
    $('.video_overlay.sa_trim_video .flex-video').html('<iframe id="landing_sa_trim_player" src="https://player.vimeo.com/video/140350411?api=1&player_id=landing_sa_trim_player&badge=0&byline=0&title=0" width="500" height="281" frameborder="0" data-progress="true" data-seek="true" data-bounce="true" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    setFlexVideoMaxHeight();
  }

  $('.watch_video_container').on('click', function() {
    $('.video_overlay.sa_promo').addClass('show');

    trackVideoOverlayOpen('sa_promo');
  });

  $('.video_overlay.sa_promo .close_button_container').on('click', function() {

    $('.video_overlay.sa_promo').removeClass('show');
    setTimeout(initVimeoPromo, 500);
  });

  $('.watch_profit_video').on('click', function() {
    $('.video_overlay.sa_trim_video').addClass('show');
    trackVideoOverlayOpen('sa_trim_video');
  });

  $('.video_overlay.sa_trim_video .close_button_container').on('click', function() {

    $('.video_overlay.sa_trim_video').removeClass('show');
    setTimeout(initVimeoTrim, 500);
  });

  setFlexVideoMaxHeight();

  setTimeout(function() {
    initVimeoPromo();
    initVimeoTrim();
  }, 500.0)


  // sparkle!!
  var sparkleContainers = $('.sparkling');
  var sparkleDocWidth = parseInt($(document).width());
  var sparkleUnit =  sparkleDocWidth / 16.0;

  var sparkledFromInit = [];

  for(var i = 0; i < sparkleContainers.length; i++ ){
    sparkledFromInit.push(false);
  }


  var makeMove = function(containerElem) {
    $(containerElem).children().each(function(k, e) {
      var elem = $(e);

      if (sparkledFromInit[k]) {
        elem.css({
          width: '',
          'margin-left': ''
        });
        sparkledFromInit[k] = false;
      } else {
        sparkledFromInit[k] = true;
        var width = parseInt(elem.css('width'));
        var marginLeft = parseInt(elem.css('margin-left'));

        var newWidth = 0;
        var newMarginLeft = 0;
        var marginLeftVariance = 0;
        var onRightEdge = false;

        if ((marginLeft + width) > (15.5 * sparkleUnit)) {
          onRightEdge = true;
        }

        // if marginLeft = 0, don't change it

        if (marginLeft === 0) {
          newMarginLeft = 0;
        } else if (onRightEdge) {
          newMarginLeft = 0;
        } else {
          marginLeftVariance = Math.ceil((((Math.random() * 2) >= 1) ? (-1 * sparkleUnit/2.0) : (sparkleUnit/2.0)));
        }

        if (onRightEdge) {
          newWidth = width - Math.ceil((((Math.random() * 2) >= 1) ? (-1 * sparkleUnit/2.0) : (sparkleUnit/2.0)));
          newMarginLeft = sparkleDocWidth - newWidth;
        } else {
          if (marginLeftVariance > 0) {
            newWidth = width - marginLeftVariance;
          } else if (marginLeftVariance < 0) {
            newWidth = width - marginLeftVariance
          } else {
            newWidth = width - Math.ceil((((Math.random() * 2) >= 1) ? (-1 * sparkleUnit/2.0) : (sparkleUnit/2.0)));
          }

          newMarginLeft = marginLeft  + marginLeftVariance;
        }

        elem.css({
          width: newWidth,
          'margin-left': newMarginLeft
        });

      }

    });
  };


  sparkleContainers.each(function(i, e) {
    setInterval(function() { makeMove(e)}, 5000);
  });

  $(window).resize(function() {
    console.log('resize!');
    setFlexVideoMaxHeight();

    sparkleDocWidth = parseInt($(document).width());
    sparkleUnit = sparkleDocWidth / 16.0;
    sparkleContainers.each(function(i, e) {
      $(e).children().each(function(j, elem) {
        $(elem).css({
          width: '',
          'margin-left': ''
        });
      });
    });
  });


  if ($('body.index').length > 0) {
    // inview gif stuff
    var inview_chat = new Waypoint.Inview({
      element: $('#how_better_scheduling_builds + .shift_color_bar')[0],
      enter: function(direction) {
        if (direction === 'down') {
          var _this = $('.chat_gif_container img');
          setTimeout(function() {
            _this.attr('src', _this.attr('data-img-url'));
          }, 250);
        }
      }
    });

    var inview_trade = new Waypoint.Inview({
      element: $('#mobile_flexibility + .shift_color_bar')[0],
      enter: function(direction) {
        if (direction === 'down') {
          var _this = $('.trade_gif_container img');
          var _this2 = $('.trade_checks_gif img');
          setTimeout(function() {
            _this.attr('src', _this.attr('data-img-url'));
            _this2.attr('src', _this2.attr('data-img-url'));
          }, 250);
        }
      }
    });

    var smartsched_inview = new Waypoint.Inview({
      element: $('section#smart_scheduling + .shift_color_bar')[0],
      enter: function(direction) {
        if (direction === 'down') {
          var _this = $('.smart_sched_gif_container img');
          setTimeout(function() {
            _this.attr('src', _this.attr('data-img-url'));
          }, 250);
        }
      }
    });

    var timlinetrim_inview = new Waypoint.Inview({
      element: $('section#intuitive_timeline + .shift_color_bar')[0],
      enter: function(direction) {
        if (direction === 'down') {
          var _this = $('.profit_gif_container img');
          setTimeout(function() {
            _this.attr('src', _this.attr('data-img-url'));
          }, 250);
        }
      }
    });

  }


  $('.tabs .tab-title').on('click', function() {
    console.log(this);

    ga('send', {
      hitType: 'event',
      eventCategory: 'LandingPage',
      eventAction: 'featuresTabChange',
      eventLabel: 'features-tabs-' + this.id
    });
  });

  var scrollWaypoints = [];
  var scrollWaypointsTriggers = [];
  $('section.track-scroll').each(function(idx, elem) {
    scrollWaypoints.push(new Waypoint.Inview({
      element: elem,
      enter: function(direction) {
        if (direction === 'down' && !scrollWaypointsTriggers[idx]) {
          ga('send', {
            hitType: 'event',
            eventCategory: 'LandingPage',
            eventAction: 'hitSectionScroll',
            eventLabel: elem.id,
            hitCallback: function() {
              scrollWaypointsTriggers[idx] = true;
            }
          });
        }
      }
    }));
    scrollWaypointsTriggers.push(false);
  });
});


function trackLogin(elem, label) {
  var url = elem.href;

  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'navigateToLogin',
    eventLabel: 'login-' + label,
    hitCallback: function() {
      document.location = url;
    }
  });
}

function trackSupportLink(elem, label) {
  var url = elem.href;

  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'navigateToSupport',
    eventLabel: 'support-link-' + label,
    hitCallback: function() {
      document.location = url;
    }
  });
}

function trackSignupClick(elem, label) {
  var url;

  if (elem) {
    url = elem.href;
  } else {
    url = 'https://shiftagent.org/sa/#/signup'
  }


  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'navigateToSignup',
    eventLabel: 'signup-' + label,
    hitCallback: function() {
      document.location = url;
    }
  });
}

function trackBetterScheduling(elem, label) {
  var url = elem.href;

  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'navigateToBetterScheduling',
    eventLabel: 'better-scheduling-link-' + label,
    hitCallback: function() {
      document.location = url;
    }
  });
}

function trackCloseVideo(label) {
  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'closeVideo',
    eventLabel: 'close-video-' + label
  });
}

function trackVideoOverlayOpen(label) {
  ga('send', {
    hitType: 'event',
    eventCategory: 'LandingPage',
    eventAction: 'openVideoOverlay',
    eventLabel: 'open-video-overlay-' + label
  });
}
