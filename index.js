/**
 * Instapaper API Client
 *
 * @author David Dripps <david.dripps@gmail.com> (http://www.daviddripps.com)
 * @created 6/29/2012
 * @see http://www.instapaper.com/api/full/
 */

//OAuth client
var OAuth = require('oauth').OAuth;
var querystring = require('qs');

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
    list        : '/bookmarks/list',
    update      : '/bookmarks/update_read_progress',
    add         : '/bookmarks/add',
    delete      : '/bookmarks/delete'
    /*
    star, unstar, archive, unarchive, move, get_text
     */
  },
  folder: {
    /*
    list, add, delete, set_order
     */
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

  //setup an oauthClient for the instance
  this.oauthClient = new OAuth(null,                  //request token url
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
Instapaper.prototype.prepareUrl = function(endpoint, queryParams) {
  if(! endpoint) throw new TypeError('You must provide a url endpoint.');

  if(endpoint.charAt(0) !== '/') endpoint = '/' + endpoint;

  var formattedUrl = BASE_URL + endpoint;

  //if the options were provided and they're an object
  if(typeof queryParams === 'object' && ! Array.isArray(queryParams)) {
    formattedUrl += '?' + querystring.stringify(queryParams);
  }

  return formattedUrl;
}

Instapaper.prototype.makeRequest = function(method, url, data, cb) {
  if(! method || typeof method !== 'string')
    throw new TypeError('You must provide a request method.');

  if(! url || typeof url !== 'string')
    throw new TypeError('You must provide a url.');

  if(typeof data == 'function') {
    cb = data;
    data = {};
  }

  if(! cb || typeof cb !== 'function')
    throw new TypeError('You must provide a callback function.');

  this.oauthClient.getProtectedResource(url ,method, this.consumerKey, this.consumerSecret, cb);
};

/**
 * Authenticates the username and password with the Instapaper API
 *
 * @param {String} username
 * @param {String} password
 * @param {Object} options
 * @param {Function} cb
 * @return {*}
 */
Instapaper.prototype.authenticate = function(username, password, options, cb) {
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

  //if no options are supplied, then assign the passed function as the callback
  if(typeof options == 'function') {
    cb = options;
    options = {};
  }

  //throw an error if no callback was supplied
  if(! cb) throw new TypeError('You must provide a callback.');

  //make sure options is an object
  if(typeof options != 'object'
  || Object.prototype.toString.call(options) === '[object Array]') {
    return cb('options must be an object.');
  }

  //set the OAuth callback path if provided in the options
  if(options.oauthCallbackPath) this.oauthCallbackPath = options.oauthCallbackPath;

  if(! this.oauthCallbackPath) return cb('No OAuth callback path provided.');

  var requestUrl = this.prepareUrl(ENDPOINT.oauth.accessToken, {
                                    x_auth_username: username,
                                    x_auth_password: password,
                                    x_auth_mode: 'client_auth'
                                  });

  return cb();
}

module.exports = Instapaper;