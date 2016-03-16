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
