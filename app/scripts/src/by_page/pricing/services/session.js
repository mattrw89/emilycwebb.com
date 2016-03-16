'use strict';

angular.module('shiftLandingApp')
  .service('Session', ['storage', '$location', '$rootScope', '$injector', 'uuid4',
    function(storage, $location, $rootScope, $injector, uuid4) {
      this.generateNewSessionId = function() {
        var id = uuid4.generate();
        storage.set('sa_randomSessionId', id);
        return id;
      };

      this.getSessionId = function() {
        return storage.get('sa_randomSessionId');
      };

      this.generateNewSessionIdIfNotSet = function() {
        var currId = storage.get('sa_randomSessionId');
        if (_.isNull(currId) || _.isUndefined(currId)) {
          return this.generateNewSessionId();
        } else {
          return currId;
        }
      };

      this.getCurrentOrgId = function () {
        return storage.get('sa_currentOrgId');
      };

      this.getCurrentUserId = function() {
        var val = storage.get('sa_currentUserId');

        if (_.isUndefined(val) || _.isNull(val)) {
          return false;
        } else {
          return val;
        }
      };
    }]);
