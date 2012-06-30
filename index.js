/**
 * Instapaper API Client
 *
 * @author David Dripps <david.dripps@gmail.com> (http://www.daviddripps.com)
 * @created 6/29/2012
 * @see http://www.instapaper.com/api/full/
 */

//OAuth client
var OAuth = require('oauth').OAuth;

//constants
API_VERSION = 1;
ENDPOINT = {
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
  this.consumerKey = consumerKey;
  this.consumerSecret = consumerSecret;

  //set the OAuth callback path if provided
  if(options && options.oauthCallbackPath) this.oauthCallbackPath = options.oauthCallbackPath;
};

Instapaper.prototype.getAuthenticateUrl = function(options, cb) {
  //if no options are supplied, then assign the passed function as the callback
  if(typeof options == 'function') {
    cb = options;
    options = {};
  }

  //make sure a callback was supplied
  if(! cb) throw new TypeError('You must provide a callback.');

  //make sure options is an object
  if(typeof options != 'object'
  || Object.prototype.toString.call(options) === '[object Array]') {
    return cb('options must be an object.');
  }

  //set the OAuth callback path if provided in the options
  if(options.oauthCallbackPath) this.oauthCallbackPath = options.oauthCallbackPath;

  if(! this.oauthCallbackPath) return cb('No OAuth callback path provided.');

  return cb();
}

module.exports = Instapaper;