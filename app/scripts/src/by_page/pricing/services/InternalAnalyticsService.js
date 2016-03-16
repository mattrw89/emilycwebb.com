'use strict';

angular.module('shiftLandingApp')
  .service('InternalAnalyticsService', ['$http', 'Session', 'ServerUrls', '$interval', function ($http, Session, ServerUrls, $interval) {
    var url_ext = 'analytics/event';
    var txQueue = [];

    var AnalyticEvent = function(eventName, data) {
      //var evt = {};
      this.user_id = Session.getCurrentUserId();

      if (this.user_id === false || _.isUndefined(this.user_id)) {
        this.user_id = null;
      }

      this.organization_id = Session.getCurrentOrgId();

      if (this.organization_id === false || _.isUndefined(this.organization_id)) {
        this.organization_id = null;
      }

      this.event_name = eventName;

      if (_.isUndefined(data) || _.keys(data).length === 0) {
        data = {};
      }

      this.data = data;
      this.session_uuid = Session.getSessionId();
      return this;
    };

    var captureAnalytic = function(eventName, data, sendNow) {
      if (_.isUndefined(sendNow)) {
        txQueue.push(new AnalyticEvent(eventName, data));
      } else {
        var analytic = new AnalyticEvent(eventName, data);
        $http.post(ServerUrls.current.analyticsCaptureApi + url_ext, [analytic], {
          headers: {
            authorization: 'Basic YW5hbHl0aWNzOmdyb3d0aGVraW5nZG9tODk3NiE='
          }
        });
      }
    };

    $interval(function() {
      if (txQueue.length > 0) {
        // capture the objects currently trying to be sent
        var eventsToSend = _.cloneDeep(txQueue);
        txQueue.splice(0, eventsToSend.length);

        $http.post(ServerUrls.current.analyticsCaptureApi + url_ext, eventsToSend, {
          headers: {
            Authorization: 'Basic YW5hbHl0aWNzOmdyb3d0aGVraW5nZG9tODk3NiE='
          }
        });
      }
    }, 5000);

    return {
      captureAnalytic: captureAnalytic
    };

  }]);
