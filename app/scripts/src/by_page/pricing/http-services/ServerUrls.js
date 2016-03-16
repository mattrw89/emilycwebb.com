'use strict';

angular.module('shiftLandingApp')
  .factory('ServerUrls', ['storage', '$location', function (storage, $location) {
    var ServerUrls = {};

    ServerUrls.servers = [
      {
        name:     'Prod',
        airbrakeEnvironment: 'Production',
        match:    ['shiftagent.org'],
        railsApi: 'https://shiftagent.org/api/v1/',
        nodeApi:  'https://shiftagent.org/api/v1/',
        analyticsCaptureApi: 'https://analytics-capture-prod.shiftagent.org/',
        selected: false
      },
      {
        name:     'Dev',
        airbrakeEnvironment: 'Staging',
        match:    ['shift-trader.com'],
        railsApi: 'https://shift-trader.com/api/v1/',
        nodeApi:  'https://shift-trader.com/api/v1/',
        analyticsCaptureApi: 'https://analytics-capture-staging.shiftagent.org/',
        selected: false
      },
      {
        name:     'Local',
        airbrakeEnvironment: 'Development',
        match:    ['localhost', '127.0.0.1', '192.168'],
        railsApi:     'http://localhost:3000/api/v1/',
        nodeApi:  'http://localhost:3002/api/v1/',
        analyticsCaptureApi: 'http://localhost:8080/',
        selected: false
      }
    ];

    ServerUrls.current = {};

    ServerUrls.getRelevantServer = function() {
      var hostname = $location.host();
      var idx = _.findIndex(ServerUrls.servers, function(srv) {
        return _.contains(srv.match, hostname);
      });

      return ServerUrls.servers[idx];
    };

    ServerUrls.changeServer = function(idx) {
      if (angular.isDefined(ServerUrls.selectedServer)) {
        ServerUrls.servers[ServerUrls.selectedServer].selected = false;
      }
      console.log(idx);
      ServerUrls.selectedServer = idx;
      storage.set('selectedServerIndex', idx);

      ServerUrls.servers[idx].selected = true;
      ServerUrls.current.name = ServerUrls.servers[idx].name;
      ServerUrls.current.match = ServerUrls.servers[idx].match;
      ServerUrls.current.railsApi = ServerUrls.servers[idx].railsApi;
      ServerUrls.current.nodeApi = ServerUrls.servers[idx].nodeApi;
      ServerUrls.current.analyticsCaptureApi = ServerUrls.servers[idx].analyticsCaptureApi;
    };

    ServerUrls.isRelevantServer = function() {
      // Monitor the $location.host() and see if it aligns with the selectedServer
      var hostname = $location.host();
      return _.contains(ServerUrls.current.match, hostname);
    };

    ServerUrls.setRelevantServer = function() {
      var hostname = $location.host();
      var idx = _.findIndex(ServerUrls.servers, function(srv) {
        return _.contains(srv.match, hostname);
      });
      console.log(idx);
      if (!angular.isDefined(idx) || idx < 0) {
        ServerUrls.changeServer(0);
        return 0;
      } else {
        ServerUrls.changeServer(idx);
        return idx;
      }
    };

    var cookieVal = storage.get('selectedServerIndex');
    ServerUrls.selectedServer =  (_.isNull(cookieVal)) ? ServerUrls.setRelevantServer() : cookieVal;
    ServerUrls.servers[ServerUrls.selectedServer].selected = true;
    ServerUrls.current = {};
    ServerUrls.current.name = ServerUrls.servers[ServerUrls.selectedServer].name;
    ServerUrls.current.match = ServerUrls.servers[ServerUrls.selectedServer].match;
    ServerUrls.current.railsApi = ServerUrls.servers[ServerUrls.selectedServer].railsApi;
    ServerUrls.current.nodeApi = ServerUrls.servers[ServerUrls.selectedServer].nodeApi;
    ServerUrls.current.analyticsCaptureApi = ServerUrls.servers[ServerUrls.selectedServer].analyticsCaptureApi;

    return ServerUrls;
  }]);
