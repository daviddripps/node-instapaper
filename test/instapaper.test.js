/**
 * Test cases for the Instapaper Client
 *
 * @author David Dripps <david.dripps@gmail.com> (http://www.daviddripps.com)
 * @created 6/29/2012
 */

/** @see https://github.com/visionmedia/should.js */
var should = require('should');
/** @see ../index.js */
var Instapaper = require('../index');

function createInstance() {
  this.instapaperClient = new Instapaper('testConsumerKey', 'testConsumerSecret', {
    oauthCallbackPath: '/instapaper/callback'
  });
}

/**
 * Test the Instapaper class
 */
suite('Instapaper', function() {
  test('should be a function', function() {
    Instapaper.should.be.a('function');
  });

  /**
   * Test an instance of the Instapaper class
   */
  suite('instance', function() {
    setup(createInstance);

    test('should be an object', function() {
      this.instapaperClient.should.be.a('object');
    });

    test('should set the consumerKey if provided as the first param', function() {
      this.instapaperClient.consumerKey.should.equal('testConsumerKey');
    });

    test('should set the consumerSecret if provided as the second param', function() {
      this.instapaperClient.consumerSecret.should.equal('testConsumerSecret');
    });

    test('should set the OAuth callback path if provided in the options', function() {
      this.instapaperClient.oauthCallbackPath.should.equal('/instapaper/callback');
    });

    /**
     * Test the authenticate() method
     */
    suite('.getAuthenticateUrl()', function() {
      setup(createInstance);

      test('should be a function', function() {
        this.instapaperClient.getAuthenticateUrl.should.be.a('function');
      });

      test('should call the provided callback', function(done) {
        this.instapaperClient.getAuthenticateUrl(function() {
          should.ok(true);
          done();
        });
      });

      test('should throw if no callback is provided', function() {
        this.instapaperClient.getAuthenticateUrl.should.throw('You must provide a callback.');
      });

      test('should respond with error if options is not an object', function(done) {
        this.instapaperClient.getAuthenticateUrl([], function(err) {
          should.exist(err);
          err.should.equal('options must be an object.')
          done();
        });
      });

      test('should set the OAuth callback url if provided in the options', function(done) {
        var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
        client.getAuthenticateUrl({
          oauthCallbackPath: '/instapaper/callback'
        }, function(err, response) {
          should.ok(true);
          client.oauthCallbackPath.should.equal('/instapaper/callback');
          done();
        });
      });

      //todo: eventually we'll want to add connect middleware so this is automatic
      test('should respond with error if no OAuth callback is available', function(done) {
        var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
        client.getAuthenticateUrl(function(err) {
          should.exist(err);
          err.should.equal('No OAuth callback path provided.');
          done();
        });
      });

      test('should set the username if provided in the options');
      test('should respond with error if no username is supplied');
      test('should set the password if provided in the options');
      test('should respond with error if no password is supplied');

      test('should return the URL to redirect the user to for authentication', function() {
        this.instapaperClient.getAuthenticateUrl(function(err, oauthUrl) {
          should.exist(oauthUrl);
          oauthUrl.should.match(/^https:\/\/www.instapaper.com\/api\/1\/oauth\/access_token.*/);
        });
      });

      test('should have x_auth_username in the authentication url');
      test('should have x_auth_password in the authentication url');
      test('should have x_auth_mode with a value of "client_auth" in the authentication url');
    })
  });
});