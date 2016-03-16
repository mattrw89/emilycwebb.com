angular.module('shiftLandingApp', ['ngCookies', 'ngResource',  'angularytics', 'angularLocalStorage',
  'ngTouch', 'ngAnimate', 'ng-currency', 'uuid4'])
  .config(['$provide', 'AngularyticsProvider', function ($provide, AngularyticsProvider) {
    AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);

    $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
      return function (exception, cause) {
        $delegate(exception, cause);
      };
    }]);
  }])
  .run(['Session', 'InternalAnalyticsService', function(Session, InternalAnalyticsService) {
    Session.generateNewSessionIdIfNotSet();
    InternalAnalyticsService.captureAnalytic('landingPage:pricing', {});
  }]);
