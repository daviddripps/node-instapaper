/**
 * Instapaper API Client
 *
 * @author David Dripps <david.dripps@gmail.com> (http://www.daviddripps.com)
 * @created 6/29/2012
 * @see http://www.instapaper.com/api/full/
 */

//OAuth client
var OAuth = require('oauth').OAuth;
//query string parser
var querystring = require('querystring');

//constants
var API_VERSION = 1;
var OAUTH_VERSION = '1.0';
var OAUTH_SIGNING_METHOD = 'HMAC-SHA1';
var BASE_URL = 'https://www.instapaper.com/api/' + API_VERSION;
var ENDPOINT = {
  oauth: {
    accessToken : '/oauth/access_token'
  },
  account: {
    verify      : '/account/verify_credentials'
  },
  bookmarks: {
    add         : '/bookmarks/add'
  }
};

/**
 * Instapaper
 *
 * @param {String} consumerKey - the applications Instapaper consumer key
 * @param {String} consumerSecret - the applications Instapaper consumer secret
 * @param {Object} options - usually used to supply an accessToken and accessTokenSecret
 * @constructor
 */
var Instapaper = function(consumerKey, consumerSecret, options) {
  if(! consumerKey) throw new TypeError('You must provide a consumer key.');
  if(! consumerSecret) throw new TypeError('You must provide a consumer secret.');

  if(options) {
    if(options.accessToken) {
      if(! options.accessTokenSecret)
        throw new Error('You must provide BOTH an accessToken and accessTokenSecret.');

      this.accessToken = options.accessToken;
    }

    if(options.accessTokenSecret) {
      if(! options.accessToken)
        throw new Error('You must provide BOTH an accessToken and accessTokenSecret.');

      this.accessTokenSecret = options.accessTokenSecret;
    }
  }

  //setup an oauthClient for the instance
  this._oauthClient = new OAuth(null,                  //request token url
                               null,                  //access token url
                               consumerKey,           //consumer key
                               consumerSecret,        //consumer secret
                               OAUTH_VERSION,         //OAuth version
                               null,                  //callback URL
                               OAUTH_SIGNING_METHOD); //encryption type
};

/**
 * Appends the endpoint to the BASE_URL and URL formats the queryParams
 *
 * @param {String} endpoint
 * @param {Object} queryParams
 * @return {String}
 */
Instapaper.prototype._prepareUrl = function(endpoint, queryParams) {
  if(! endpoint) throw new TypeError('You must provide a url endpoint.');

  if(endpoint.charAt(0) !== '/') endpoint = '/' + endpoint;

  var formattedUrl = BASE_URL + endpoint;

  //if the options were provided and they're an object
  if(typeof queryParams === 'object' && ! Array.isArray(queryParams)) {
    formattedUrl += '?' + querystring.stringify(queryParams);
  }

  return formattedUrl;
}

/**
 * makes an authenticated request to the Instapaper API
 *
 * @param {String} url
 * @param {Object} data
 * @param {Function} cb
 */
Instapaper.prototype._makeRequest = function(url, data, cb) {
  if(! url || typeof url !== 'string')
    throw new TypeError('You must provide a url.');

  if(typeof data == 'function') {
    cb = data;
    data = null;
  }

  if(! cb || typeof cb !== 'function')
    throw new TypeError('You must provide a callback function.');

  if(! this.accessToken)
    return cb('You must provide an oauth token before making authenticated requests.');

  if(! this.accessTokenSecret)
    return cb('You must provide an oauth secret before making authenticated requests.');

  var should = require('should');

  //Makes the secure request to the Instapaper API. All requests to the Instapaper API must be
  //made via the POST method
  this._oauthClient.post(url, this.accessToken, this.accessTokenSecret, data, function(err, res) {
    if(err || ! res) {
      if(err && err.data) {
        try {
          err.data = JSON.parse(err.data);
        } catch(ignore) {}

        if(Array.isArray(err.data))
          return cb(err.data[0].message);
        else
          return cb(err.data);
      } else {
        return cb(err || 'An error occurred.  Sorry for not being a helpful description.');
      }
    }

    //organize the response data by the type so it's easy for the other methods to filter
    var dataOrganizedByType = {};

    for(var i = 0, l = res.length; i < l; i++) {
      //get the type and remove it from the record
      var recordType = new String(res[i].type);
      var recordNoType = Object.create(Object.getPrototypeOf(res[i]));
      var props = Object.getOwnPropertyNames(res[i]);
      var pName;
      //remove the type from the object
      props.splice(props.indexOf('type'), 1);
      for (var p in props) {
        pName = props[p];
        Object.defineProperty(recordNoType, pName, Object.getOwnPropertyDescriptor(res[i], pName));
      };

      //if there's no key for this type yet, create it
      if(! dataOrganizedByType[recordType])
        dataOrganizedByType[recordType] = [];

      //set the record data, sans type, to the type key
      dataOrganizedByType[recordType].push(recordNoType);
    }

    return cb(null, dataOrganizedByType);
  });
};

Instapaper.prototype._filterResponse = function(err, res, cb) {
  if(! cb) throw new TypeError('You must provide a callback.');

  if(err || ! res) {
    if(err && err.data) {
      try {
        err.data = JSON.parse(err.data);
      } catch(ignore) {}

      if(Array.isArray(err.data))
        return cb(err.data[0].message);
      else
        return cb(err.data);
    } else {
      return cb(err || 'An error occurred.  Sorry for not being a helpful description.');
    }
  }

  try {
    res = JSON.parse(res);
  } catch(ignore) {}

  //organize the response data by the type so it's easy for the other methods to filter
  var dataOrganizedByType = {};

  for(var i = 0, l = res.length; i < l; i++) {
    //get the type and remove it from the record
    var recordType = new String(res[i].type);
    var recordNoType = Object.create(Object.getPrototypeOf(res[i]));
    var props = Object.getOwnPropertyNames(res[i]);
    var pName;
    //remove the type from the object
    props.splice(props.indexOf('type'), 1);
    for (var p in props) {
      pName = props[p];
      Object.defineProperty(recordNoType, pName, Object.getOwnPropertyDescriptor(res[i], pName));
    };

    //if there's no key for this type yet, create it
    if(! dataOrganizedByType[recordType])
      dataOrganizedByType[recordType] = [];

    //set the record data, sans type, to the type key
    dataOrganizedByType[recordType].push(recordNoType);
  }

  cb(null, dataOrganizedByType);
};

/**
 * Authenticates the username and password with the Instapaper API
 *
 * @param {String} username
 * @param {String} password
 * @param {Function} cb
 */
Instapaper.prototype.authenticate = function(username, password, cb) {
  //if no username is provided then return an error
  if(typeof username == 'function') {
    cb = username;
    return cb('You must provide a username to authenticate.');
  }

  //if no password is provided then return an error
  if(typeof password == 'function') {
    cb = password;
    return cb('You must provide a password to authenticate.');
  }

  //get the access_token url
  var requestUrl = this._prepareUrl(ENDPOINT.oauth.accessToken),
      self = this;

  this._oauthClient._performSecureRequest(null, null, 'POST', requestUrl, {
    x_auth_mode: 'client_auth',
    x_auth_password: password,
    x_auth_username: username
  }, null, null, function(err, data) {
    if(err) return cb(err.data || err);

    var data = querystring.parse(data);

    self.accessToken = data.oauth_token;
    self.accessTokenSecret = data.oauth_token_secret;

    cb(null, data);
  });
};

/**
 * gets the user id and username corresponding to the provided accessToken
 *
 * @param cb
 */
Instapaper.prototype.getUser = function(cb) {
  if(! cb || typeof cb !== 'function')
    throw new TypeError('You must provide a callback function.');

  if(! this.accessToken || ! this.accessTokenSecret)
    return cb('No accessToken or accessTokenSecret provided.');

  var verifyUrl = this._prepareUrl(ENDPOINT.account.verify),
      self = this;

  this._oauthClient.get(verifyUrl, this.accessToken, this.accessTokenSecret, function(err, res) {
    self._filterResponse(err, res, function(err, filteredData) {
      if(err) return cb(err);

      return cb(null, filteredData.user[0]);
    });
//    if(err || ! res) {
//      if(err && err.data) {
//        try {
//          err.data = JSON.parse(err.data);
//        } catch(ignore) {}
//
//        if(Array.isArray(err.data))
//          return cb(err.data[0].message);
//        else
//          return cb(err.data);
//      } else {
//        return cb(err || 'An error occurred.  Sorry for not being a helpful description.');
//      }
//    }
//
//    //organize the response data by the type so it's easy for the other methods to filter
//    var dataOrganizedByType = {};
//
//    for(var i = 0, l = res.length; i < l; i++) {
//      //get the type and remove it from the record
//      var recordType = new String(res[i].type);
//      var recordNoType = Object.create(Object.getPrototypeOf(res[i]));
//      var props = Object.getOwnPropertyNames(res[i]);
//      var pName;
//      //remove the type from the object
//      props.splice(props.indexOf('type'), 1);
//      for (var p in props) {
//        pName = props[p];
//        Object.defineProperty(recordNoType, pName, Object.getOwnPropertyDescriptor(res[i], pName));
//      };
//
//      //if there's no key for this type yet, create it
//      if(! dataOrganizedByType[recordType])
//        dataOrganizedByType[recordType] = [];
//
//      //set the record data, sans type, to the type key
//      dataOrganizedByType[recordType].push(recordNoType);
//    }
//
//    return cb(null, dataOrganizedByType.user[0]);
  });
};

/**
 * adds a new bookmark to the authenticated user's Instapaper account
 *
 * @param {String} url - the URL of the page to bookmark
 * @param {Object} options - valid keys: title, description, folder_id, resolve_final_url
 * @param {Function} cb
 */
Instapaper.prototype.addBookmark = function(url, options, cb) {
  if(! url)
    throw new TypeError('You must provide a url to bookmark.');

  if(typeof options == 'function') {
    cb = options;
    options = {};
  }

  if(! cb || typeof cb !== 'function')
    throw new TypeError('You must provide a callback.');

  if(! this.accessToken || ! this.accessTokenSecret)
    throw new TypeError('No access token or secret provided.');

  var addUrl = this._prepareUrl(ENDPOINT.bookmarks.add),
      self = this;

  this._oauthClient.post(addUrl, this.accessToken, this.accessTokenSecret, options,
  function(err, res) {
    self._filterResponse(err, res, function(err, filteredData) {
      if(err) return cb(err);

      return cb(null, filteredData.bookmark[0]);
    });
  });
};

module.exports = Instapaper;