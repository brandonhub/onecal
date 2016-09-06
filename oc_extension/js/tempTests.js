function startTests() {
  chrome.storage.local.clear(function() {
    createTestClient().then(function(testClient) {
      runCurrentTest(testClient);
    });
  });
}

function createTestClient() {
  var promise = new Promise(function(resolve, reject) {
    var test_user_data = {
      'email': 'test137@test.com',
      'password': 'MEEKS_PLACEHOLDER'
    };
    var server = 'http://127.0.0.1:8000';
    var testClient = new APIClient(server);
    testClient.isAuthenticated().then(function(isAuthenticated) {
      if (isAuthenticated == true) {
        console.log('Authenticated. Token was stored.')
        runCurrentTest(testClient);
      } else {
        testClient.authenticate(test_user_data, false).then(function() {
          console.log('Authenticated. User was logged in.')
          runCurrentTest(testClient);
        });
      }
    });
  });
  return promise;
}

function runCurrentTest(testClient) {
  //_createCalendarTest(testClient);
  _fetchCalendarsTest(testClient);
  //_changeDataSourceCalendarTest(testClient);
}

function _createCalendarTest(testClient) {
  var newCalendarData = {
    'name': 'Test Calendar Name',
  };
  testClient.createCalendar(newCalendarData).then(function(calendarData) {
    console.log(calendarData)
  });
}

function _fetchCalendarsTest(testClient) {
  testClient.fetchCalendars().then(function(calendarsData) {
    console.log(calendarsData);
  });
}

function _changeDataSourceCalendarTest(testClient) {
  testClient.changeDataSourceCalendar(1, 2).then(function(calendarsData) {
    console.log(calendarsData);
  });
}