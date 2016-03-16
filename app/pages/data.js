var _ = require('lodash');

module.exports = function(fileName) {
  var graphData = {
    author: 'Emily C. Webb',
    description: 'Emily C. Webb | Curriculum developer, primary grades educator',
    url: 'https://emilycwebb.com/',
    locale: 'en_US',
    site_name: 'Emily C. Webb',
    image: '',
    title: 'Emily C. Webb',
    twitterHandle: '@ecwebb',
    twitterDomain: 'Emily Webb',
    twitterImage: ''
  };

  var base = {
    title: "Emily C. Webb",
    graph: graphData,
    faviconUrl: '',
    basic: {
      linkedInUrl: 'https://www.linkedin.com/in/emilycwebb',
      contactEmail: 'emily@emilycwebb.com',
      currentYear: new Date().getFullYear()
    }
  };

  var pageData = {
    index: {

    },
    about: {
      title: 'About Shift Agent'
    }
  };

  pageData[fileName].currentPage = fileName;
  return _.extend(base, pageData[fileName]);
};

