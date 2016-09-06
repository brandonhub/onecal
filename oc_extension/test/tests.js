'use strict';

var requirejs = require('requirejs');
requirejs.config({
  paths: {
    'jquery': '../node_modules/jquery/dist/jquery',
  }
});

var mocha = require('mocha');
var APIClient = require('../js/APIClient');




describe('User Management', function() {

  it('User Creation', function(done) {
    var test_user_data = {
      'email': 'test@test.com',
      'password': 'KfrDWzpUZCW83J'
    };
    var server = 'http://127.0.0.1:8000';
    var client = new APIClient(server, test_user_data, true).then(function(data) {
      console.log(data);
      done();
    }, function(error) {
      done(error);
    });
  });
  
});
