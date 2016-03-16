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

'use strict';

angular.module('shiftLandingApp')
  .service('LeadSubmissionService', ['$http', 'Session', 'ServerUrls', function ($http, Session, ServerUrls) {
    var url_ext = 'analytics/lead';

    var LeadData = function(companyName, name, phone, email, data) {
      this.user_id = Session.getCurrentUserId();

      if (this.user_id === false || _.isUndefined(this.user_id)) {
        this.user_id = null;
      }

      this.organization_id = Session.getCurrentOrgId();

      if (this.organization_id === false || _.isUndefined(this.organization_id)) {
        this.organization_id = null;
      }

      if (_.isUndefined(data) || _.keys(data).length === 0) {
        data = {};
      }

      this.data = data;
      this.company_name = companyName;
      this.email = email;
      this.phone_number = phone;
      this.name = name;
      this.source = "landing";
      this.session_uuid = Session.getSessionId();
      return this;
    };

    var sendLead = function(companyName, name, phone, email, data) {
      var leadData = new LeadData(companyName, name, phone, email, data);

      return $http.post(ServerUrls.current.analyticsCaptureApi + url_ext, leadData, {
        headers: {
          Authorization: 'Basic YW5hbHl0aWNzOmdyb3d0aGVraW5nZG9tODk3NiE='
        }
      });
    };


    return {
      sendLead: sendLead
    };

  }]);

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

!function(a){"use strict";a.module("uuid4",[]).factory("uuid4",function(){var a=function(a){return Math.pow(2,a)},b=(a(4),a(6)),c=a(8),d=a(12),e=(a(14),a(16)),f=a(32),g=(a(40),a(48),function(a,b){return Math.floor(Math.random()*(b-a+1))+a}),h=function(){return g(0,b-1)},i=function(){return g(0,c-1)},j=function(){return g(0,d-1)},k=function(){return g(0,e-1)},l=function(){return g(0,f-1)},m=function(){return(0|Math.random()*(1<<30))+(0|Math.random()*(1<<18))*(1<<30)},n=function(a,b,c){a=String(a),c=c?c:"0";for(var d=b-a.length;d>0;d>>>=1,c+=c)1&d&&(a=c+a);return a},o=function(a,b,c,d,e,f){var g=n(a.toString(16),8)+"-"+n(b.toString(16),4)+"-"+n(c.toString(16),4)+"-"+n(d.toString(16),2)+n(e.toString(16),2)+"-"+n(f.toString(16),12);return g};return{generate:function(){return o(l(),k(),16384|j(),128|h(),i(),m())},validate:function(a){var b=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;return b.test(a)}}})}(angular);
angular.module('angularLocalStorage', ['ngCookies']).factory('storage', ['$parse', '$cookieStore', '$window', '$log', function ($parse, $cookieStore, $window, $log) {
	/**
	 * Global Vars
	 */
	var storage = (typeof $window.localStorage === 'undefined') ? undefined : $window.localStorage;
	var supported = !(typeof storage === 'undefined' || typeof $window.JSON === 'undefined');

	var privateMethods = {
		/**
		 * Pass any type of a string from the localStorage to be parsed so it returns a usable version (like an Object)
		 * @param res - a string that will be parsed for type
		 * @returns {*} - whatever the real type of stored value was
		 */
		parseValue: function (res) {
			var val;
			try {
				val = $window.JSON.parse(res);
				if (typeof val === 'undefined') {
					val = res;
				}
				if (val === 'true') {
					val = true;
				}
				if (val === 'false') {
					val = false;
				}
				if ($window.parseFloat(val) === val && !angular.isObject(val)) {
					val = $window.parseFloat(val);
				}
			} catch (e) {
				val = res;
			}
			return val;
		}
	};

	var publicMethods = {
		/**
		 * Set - let's you set a new localStorage key pair set
		 * @param key - a string that will be used as the accessor for the pair
		 * @param value - the value of the localStorage item
		 * @returns {*} - will return whatever it is you've stored in the local storage
		 */
		set: function (key, value) {
			if (!supported) {
				try {
					$cookieStore.put(key, value);
					return value;
				} catch(e) {
					$log.log('Local Storage not supported, make sure you have angular-cookies enabled.');
				}
			}
			var saver = $window.JSON.stringify(value);
			storage.setItem(key, saver);
			return privateMethods.parseValue(saver);
		},

		/**
		 * Get - let's you get the value of any pair you've stored
		 * @param key - the string that you set as accessor for the pair
		 * @returns {*} - Object,String,Float,Boolean depending on what you stored
		 */
		get: function (key) {
			if (!supported) {
				try {
					return privateMethods.parseValue($.cookie(key));
				} catch (e) {
					return null;
				}
			}
			var item = storage.getItem(key);
			return privateMethods.parseValue(item);
		},

		/**
		 * Remove - let's you nuke a value from localStorage
		 * @param key - the accessor value
		 * @returns {boolean} - if everything went as planned
		 */
		remove: function (key) {
			if (!supported) {
				try {
					$cookieStore.remove(key);
					return true;
				} catch (e) {
					return false;
				}
			}
			storage.removeItem(key);
			return true;
		},

		/**
		 * Bind - let's you directly bind a localStorage value to a $scope variable
		 * @param {Angular $scope} $scope - the current scope you want the variable available in
		 * @param {String} key - the name of the variable you are binding
		 * @param {Object} opts - (optional) custom options like default value or unique store name
         * Here are the available options you can set:
         * * defaultValue: the default value
         * * storeName: add a custom store key value instead of using the scope variable name
		 * @returns {*} - returns whatever the stored value is
		 */
		bind: function ($scope, key, opts) {
            var defaultOpts = {
                defaultValue: '',
                storeName: ''
            };
            // Backwards compatibility with old defaultValue string
            if (angular.isString(opts)) {
                opts = angular.extend({},defaultOpts,{defaultValue:opts});
            } else {
                // If no defined options we use defaults otherwise extend defaults
                opts = (angular.isUndefined(opts)) ? defaultOpts : angular.extend(defaultOpts,opts);
            }

			// Set the storeName key for the localStorage entry
			// use user defined in specified
			var storeName = opts.storeName || key;

			// If a value doesn't already exist store it as is
			if (!publicMethods.get(storeName)) {
				publicMethods.set(storeName, opts.defaultValue);
			}

			// If it does exist assign it to the $scope value
			$parse(key).assign($scope, publicMethods.get(storeName));

			// Register a listener for changes on the $scope value
			// to update the localStorage value
			$scope.$watch(key, function (val) {
				if (angular.isDefined(val)) {
					publicMethods.set(storeName, val);
				}
			}, true);

			return publicMethods.get(storeName);
		},
		/**
		 * Unbind - let's you unbind a variable from localStorage while removing the value from both
		 * the localStorage and the local variable and sets it to null
		 * @param $scope - the scope the variable was initially set in
		 * @param key - the name of the variable you are unbinding
		 * @param storeName - (optional) if you used a custom storeName you will have to specify it here as well
		 */
		unbind: function($scope,key,storeName) {
			storeName = storeName || key;
			$parse(key).assign($scope, null);
			$scope.$watch(key, function () { });
			publicMethods.remove(storeName);
		},
		/**
		 * Clear All - let's you clear out ALL localStorage variables, use this carefully!
		 */
		clearAll: function() {
			storage.clear();
		}
	};
	return publicMethods;
}]);

/**
 * The solution to tracking page views and events in a SPA with AngularJS
 * @version v0.2.3 - 2013-09-19
 * @link https://github.com/mgonto/angularytics
 * @author Martin Gontovnikas <martin@gonto.com.ar>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
!function(){angular.module("angularytics",[]).provider("Angularytics",function(){var a=["Google"];this.setEventHandlers=function(c){angular.isString(c)&&(c=[c]),a=[],angular.forEach(c,function(c){a.push(b(c))})};var b=function(a){return a.charAt(0).toUpperCase()+a.substring(1)},c="$locationChangeSuccess";this.setPageChangeEvent=function(a){c=a},this.$get=["$injector","$rootScope","$location",function(b,d,e){var f=[];angular.forEach(a,function(a){f.push(b.get("Angularytics"+a+"Handler"))});var g=function(a){angular.forEach(f,function(b){a(b)})},h={};return h.init=function(){},h.trackEvent=function(a,b,c,d,e){g(function(f){a&&b&&f.trackEvent(a,b,c,d,e)})},h.trackPageView=function(a){g(function(b){a&&b.trackPageView(a)})},d.$on(c,function(){h.trackPageView(e.path())}),h}]})}(),function(){angular.module("angularytics").factory("AngularyticsConsoleHandler",["$log",function(a){var b={};return b.trackPageView=function(b){a.log("URL visited",b)},b.trackEvent=function(b,c,d,e,f){a.log("Event tracked",b,c,d,e,f)},b}])}(),function(){angular.module("angularytics").factory("AngularyticsGoogleHandler",["$log",function(){var a={};return a.trackPageView=function(a){_gaq.push(["_set","page",a]),_gaq.push(["_trackPageview",a])},a.trackEvent=function(a,b,c,d,e){_gaq.push(["_trackEvent",a,b,c,d,e])},a}]).factory("AngularyticsGoogleUniversalHandler",function(){var a={};return a.trackPageView=function(a){ga("set","page",a),ga("send","pageview",a)},a.trackEvent=function(a,b,c,d,e){ga("send","event",a,b,c,d,{nonInteraction:e})},a})}(),function(){angular.module("angularytics").filter("trackEvent",["Angularytics",function(a){return function(b,c,d,e,f,g){return a.trackEvent(c,d,e,f,g),b}}])}();
angular.module("ng-currency",[]).directive("ngCurrency",["$filter","$locale",function(b,a){return{require:"ngModel",scope:{min:"=min",max:"=max",currencySymbol:"@",ngRequired:"=ngRequired"},link:function(k,f,j,e){function d(l){return RegExp("\\d|\\-|\\"+l,"g")}function c(l){return RegExp("\\-{0,1}((\\"+l+")|([0-9]{1,}\\"+l+"?))&?[0-9]{0,2}","g")}function g(n){n=String(n);var m=a.NUMBER_FORMATS.DECIMAL_SEP;var l=null;if(RegExp("^-[\\s]*$","g").test(n)){n="-0"}if(d(m).test(n)){l=n.match(d(m)).join("").match(c(m));l=l?l[0].replace(m,"."):null}else{cleaned=null}return l}function h(){if(angular.isDefined(k.currencySymbol)){return k.currencySymbol}else{return a.NUMBER_FORMATS.CURRENCY_SYM}}e.$parsers.push(function(l){cVal=g(l);return parseFloat(cVal)});f.on("blur",function(){f.val(b("currency")(e.$modelValue,h()))});e.$formatters.unshift(function(l){return b("currency")(l,h())});k.$watch(function(){return e.$modelValue},function(m,l){i(m)});function i(n){if(!k.ngRequired&&isNaN(n)){return}if(k.min){var m=parseFloat(k.min);e.$setValidity("min",n>=m)}if(k.max){var l=parseFloat(k.max);e.$setValidity("max",n<=l)}}}}}]);
'use strict';

angular.module('shiftLandingApp')
    .controller('HomeCtrl', ['$scope', '$timeout', 'Angularytics', '$rootScope', 'InternalAnalyticsService',
    '$interval', 'LeadSubmissionService', '$filter',
    function ($scope, $timeout, Angularytics, $rootScope, InternalAnalyticsService,
                                      $interval, LeadSubmissionService, $filter) {
      $scope.priceLeadForm = {
        companyName: '',
        name: '',
        email: '',
        phoneNumber: '',
        checkboxes: {
          iMake: false,
          iOversee: false,
          iNotMake: false
        }
      };

      $scope.priceCalcForm = {
        numEmployees: 47,
        onboardingCost: 500,
        numTurnovers: 2,
        managerSchedulingHours: 4,
        numManagerInteractionsPerWeek: 20,
        managerHourlyRate: 10.00,
        empCheckSchedule: 2
      };

      $scope.priceCalcResults = {};

      var getShiftCost = function() {
        var x = $scope.priceCalcForm.numEmployees;

        if (x <= 29) {
          return 47;
        } else if (x >= 30 && x <= 49 ) {
            return 67;
        } else if (x >= 50 && x <= 69) {
            return 87;
        } else if (x >= 70 && x <= 89) {
            return 107;
        } else if (x >= 90 && x <= 109) {
            return 127;
        } else if (x >= 110 && x <= 129) {
            return 147;
        } else if (x >= 130 && x <= 149) {
          return 167;
        } else if (x >= 150) {
          return null;
        }
      };

      var numPriceCalcFormChanges = -1;
      var queuedPriceCalcFormChanges = [];

      $interval(function() {
        if (queuedPriceCalcFormChanges.length > 0) {
          InternalAnalyticsService.captureAnalytic('landingPage:priceCalcChange', _.last(queuedPriceCalcFormChanges));
          queuedPriceCalcFormChanges = [];
          ga('send', {
            hitType: 'event',
            eventCategory: 'LandingPage',
            eventAction: 'pricingCalculatorChanged'
          });
        }
      }, 5000);

      $scope.$watch('priceCalcForm', function() {
        $scope.priceCalcResults.turnoverCostPerMonth = $scope.priceCalcForm.onboardingCost * $scope.priceCalcForm.numTurnovers / 12.0;
        $scope.priceCalcResults.schedulingCost = $scope.priceCalcForm.managerSchedulingHours * $scope.priceCalcForm.managerHourlyRate * 4.0;
        $scope.priceCalcResults.managerInteractionCost = $scope.priceCalcForm.numManagerInteractionsPerWeek / 10.0 * $scope.priceCalcForm.managerHourlyRate * 4.0;
        $scope.priceCalcResults.empConvenienceCost = ($scope.priceCalcForm.empCheckSchedule * $scope.priceCalcForm.numEmployees / 60) * 4 * 8; // 4 weeks and $8.00 per hour
        $scope.priceCalcResults.totalPerMonth = $scope.priceCalcResults.turnoverCostPerMonth + $scope.priceCalcResults.schedulingCost + $scope.priceCalcResults.managerInteractionCost + $scope.priceCalcResults.empConvenienceCost;

        $scope.priceCalcResults.shiftSubscriptionCost = getShiftCost();
        $scope.priceCalcResults.shiftLaborCost = 1.0 * $scope.priceCalcForm.managerHourlyRate * 1.0; // 0.25hrs/week
        $scope.priceCalcResults.shiftTotalCost = $scope.priceCalcResults.shiftSubscriptionCost + $scope.priceCalcResults.shiftLaborCost;
        $scope.priceCalcResults.savingsPerMonth = $scope.priceCalcResults.totalPerMonth - $scope.priceCalcResults.shiftTotalCost;
        $scope.priceCalcResults.percentSavingsPerMonth = $scope.priceCalcResults.savingsPerMonth / $scope.priceCalcResults.totalPerMonth * 100.0;

        numPriceCalcFormChanges += 1;
        if (numPriceCalcFormChanges > 0) {
          queuedPriceCalcFormChanges.push({
            formData: $scope.priceCalcForm,
            results: $scope.priceCalcResults
          });
        }

      }, true);

      $scope.isMoreThanLastPlan = function() {
        return $scope.priceCalcForm.numEmployees >= 150;
      };

      $scope.trackPricingSignupLink = function() {
        trackSignupClick(null, 'pricing-signup-button');
        InternalAnalyticsService.captureAnalytic('landingPage:pricingSignupLink:clicked', {}, true);
      };

      var isSendingPricingRequest = false;
      $scope.hasSentPricingRequest = false;
      $scope.sendPricingRequestForm = function() {
        if (!isSendingPricingRequest) {
          isSendingPricingRequest = true;
          LeadSubmissionService.sendLead(
            $scope.priceLeadForm.companyName,
            $scope.priceLeadForm.name,
            $scope.priceLeadForm.phoneNumber,
            $scope.priceLeadForm.email,
            {
              results: (function() {
                var temp = {};
                _.each($scope.priceCalcResults, function(val, key) {
                  temp[key] = parseFloat($filter('number')(val, 2));
                });
                return temp;
              }()),
                form:$scope.priceCalcForm,
                checks: $scope.priceLeadForm.checkboxes
            }
          )
            .then(function(result) {
              $scope.hasSentPricingRequest = true;
              isSendingPricingRequest = false;

              ga('send', {
                hitType: 'event',
                eventCategory: 'LandingPage',
                eventAction: 'pricingRequestFormSubmitted'
              });

            }, function() {
              isSendingPricingRequest = false;
              $scope.hasSentPricingRequest = true;

            });

        }
      };

    }]);
