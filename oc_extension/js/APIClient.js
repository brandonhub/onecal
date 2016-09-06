'use strict';

class APIClient {
  constructor(server) {
    this.server = server;
  }

  isAuthenticated() {
    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      chrome.storage.local.get('user', function(data) {
        if ('user' in data) {
          _this.token = data.user.token;
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    return promise;
  }

  authenticate(data, newUser) {
    // data: email, password

    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      if (newUser) {
        _this._createUser(data).then(function() {
          return _this._fetchToken(data);
        }).then(function(responseData) {
          _this.token = responseData.token;
          chrome.storage.local.set({'user': responseData}, function() {
            resolve();
          });
        }).catch(function(error) {
          reject(error);
        });
      } else {
        _this._fetchToken(data).then(function(responseData) {
          _this.token = responseData.token;
          chrome.storage.local.set({'user': responseData}, function() {
            resolve();
          });
        });
      }
    });
    return promise;

  }

  createCalendar(data) {
    var url = this.server + '/events/calendars/';
    var method = 'post';
    var authRequired = true;
    return this._makeRequest(url, method, data, authRequired);
  }

  fetchCalendars() {
    var url = this.server + '/events/calendars/';
    var method = 'get';
    var authRequired = true;
    return this._makeRequest(url, method, {}, authRequired);
  }

  createDataSource(data, calendarId) {
    var url = this.server + '/events/calendars/' + calendarId + '/sources/';
    var method = 'post';
    var authRequired = true;
    return this._makeRequest(url, method, data, authRequired);
  }

  changeDataSourceCalendar(dataSourceId, newCalendarId) {
    var url = this.server + '/events/calendars/' + newCalendarId + '/sources/' + dataSourceId + '/';
    var method = 'put';
    var authRequired = true;
    return this._makeRequest(url, method, {}, authRequired);
  }

  logoutUser() {
    chrome.storage.local.clear();
  }

  _constructError(jqXHR) {
    var message = jqXHR.responseJSON.detail;
    var code = jqXHR.status;
    if ('errors' in jqXHR.responseJSON) {
      var fieldErrors = jqXHR.responseJSON.field_errors;
      return new APIClientError(message, code, fieldErrors);
    }
    return new APIClientError(message, code);
  }

  _makeRequest(url, method, data, authRequired) {
    var headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authRequired) {
      headers['Authorization'] = 'Token ' + this.token;
    }

    var _this = this;
    var promise = new Promise(function(resolve, reject) {
      $.ajax({
        url: url,
        method: method,
        data: JSON.stringify(data),
        headers: headers,
      }).done(resolve)
        .fail(function(jqXHR, textStatus, errorThrown) {
        var error = _this._constructError(jqXHR);
        reject(error);
      });
    });

    return promise;
  }

  _createUser(data) {
    // data: email, password
    var url = this.server + '/users/';
    var method = 'post';
    var authRequired = false;
    return this._makeRequest(url, method, data, authRequired);
  }

  _fetchToken(data) {
    var url = this.server + '/users/tokens/';
    var method = 'post';
    var authRequired = false;
    return this._makeRequest(url, method, data, authRequired);
  }
}


function APIClientError(message, code, fieldErrors) {
  this.message = message;
  this.code = code;
  this.fieldErrors = fieldErrors || [];
}
APIClientError.prototype = Object.create(Error.prototype);
APIClientError.prototype.constructor = APIClientError;