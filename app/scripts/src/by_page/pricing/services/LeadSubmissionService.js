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
