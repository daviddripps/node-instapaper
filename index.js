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
//REST client for authentication POST request
var restler = require('restler');

//constants
var API_VERSION = 1;
var OAUTH_VERSION = '1.0a';
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
 * @constructor
 */
var Instapaper = function(consumerKey, consumerSecret, options) {
  if(! consumerKey) throw new TypeError('You must provide a consumer key.');
  this.consumerKey = consumerKey;

  if(! consumerSecret) throw new TypeError('You must provide a consumer secret.');
  this.consumerSecret = consumerSecret;

  //set the OAuth callback path if provided
  if(options && options.oauthCallbackPath) this.oauthCallbackPath = options.oauthCallbackPath;

  //a RESTful client for makingthe POST request in authenticate()
  this._restler = restler;

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
    data = {};
  }

  if(! cb || typeof cb !== 'function')
    throw new TypeError('You must provide a callback function.');

  //all requests to the Instapaper API must be made via the POST method
  this._oauthClient.post(url, this.consumerKey, this.consumerSecret, data, cb);
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

  //throw an error if no callback was supplied
  if(! cb) throw new TypeError('You must provide a callback.');

  //get the access_token url
  var requestUrl = this._prepareUrl(ENDPOINT.oauth.accessToken);

  //create the necessary OAuth parameters and signature for the request
  var orderedParameters = this._oauthClient._prepareParameters(null, null, 'POST', requestUrl, {
                                                                x_auth_username: username,
                                                                x_auth_password: password,
                                                                x_auth_mode: 'client_auth'
                                                              });

  //turn the orderedParameters into a key:value object
  var postBody = {};
  for( var i= 0 ; i < orderedParameters.length; i++) {
    postBody[orderedParameters[i][0]] = orderedParameters[i][1];
  }

  //make the authentication request
  //note: this is done using the "complete" event and the "err" and "data" variables to make testing
  //      easier, normally you'd just do the callback in the "success" or "error" event handlers
  var err = null, data = null;

  this._restler.post(requestUrl, {
    data: postBody
  }).on('success', function(res) {
    data = querystring.parse(res);
  }).on('error', function(res) {
    err = res;
  }).on('complete', function() {
    return cb(err, data);
  });
}

module.exports = Instapaper;