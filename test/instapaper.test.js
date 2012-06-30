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
/** @see ../index.js */
var BASE_URL = 'https://www.instapaper.com/api/1';
/** @see ./lib/instapaper_api.stub.js */
var ApiResponse = require('./lib/instapaper_api.stub.js');

//a setup function to create a new instance of the Instapaper class in the test's scope
function createInstance() {
  this.noOptionsClient = new Instapaper('testConsumerKey', 'testConsumerSecret');

  this.instapaperClient = new Instapaper('testConsumerKey', 'testConsumerSecret', {
    oauthCallbackPath: '/instapaper/callback',
    username: 'testUsername',
    password: 'testPassword'
  });

  this.instapaperClient.oauthClient = {
    getProtectedResource: (function() {
      var fn = function(url ,method, consumerKey, consumerSecret, cb) {
        fn.executed = true;
        fn.args = arguments;

        //remove the BASE_URL to just leave the endpoint
        url = url.replace(BASE_URL, '');

        if(! ApiResponse[url])
          return cb();
        else
          return cb(null, ApiResponse[url].success);
      }

      fn.executed = false;

      return fn;
    }())
  };

  this.errorClient = new Instapaper('testConsumerKey', 'testConsumerSecret', {
    oauthCallbackPath: '/instapaper/callback',
    username: 'testUsername',
    password: 'testPassword'
  });

  this.errorClient.oauthClient = {
    getProtectedResource: function() {
      var fn = function(url ,method, consumerKey, consumerSecret, cb) {
        fn.executed = true;
        fn.args = arguments;

        //remove the BASE_URL to just leave the endpoint
        url = url.replace(BASE_URL, '');

        if(! ApiResponse[url])
          return cb();
        else
          return cb(ApiResponse[url].error);
      }

      fn.executed = false;

      return fn;
    }
  };
}

//a function for stubbing dependencies
function stubFn(returnValue) {
  var fn = function() {
    fn.executed = true;
    fn.args = arguments;

    return returnValue;
  };

  fn.executed = false;

  return fn;
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

    test('should throw if no consumerKey is provided', function() {
      (function() {
        var client = new Instapaper();
      }.bind(this)).should.throw('You must provide a consumer key.');
    });

    test('should set the consumerSecret if provided as the second param', function() {
      this.instapaperClient.consumerSecret.should.equal('testConsumerSecret');
    });

    test('should throw if no consumerSecret is provided', function() {
      (function() {
        var client = new Instapaper('testConsumerKey');
      }.bind(this)).should.throw('You must provide a consumer secret.');
    });

    test('should set the OAuth callback path if provided in the options', function() {
      this.instapaperClient.oauthCallbackPath.should.equal('/instapaper/callback');
    });

    test('should not throw if no options are provided', function() {
      (function() {
        var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
      }.bind(this)).should.not.throw();
    });

    test('should create an oauthClient if consumer with valid info if key and secret are provided',
    function() {
      var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
      client.oauthClient.should.be.a('object');
      client.oauthClient._consumerKey.should.equal('testConsumerKey');
      client.oauthClient._consumerSecret.should.equal('testConsumerSecret');
    });

    /**
     * Test the prepareUrl() method
     */
    suite('.prepareUrl()', function() {
      setup(createInstance);

      test('should be a function', function() {
        this.instapaperClient.prepareUrl.should.be.a('function');
      });

      test('should throw if no endpoint is provided', function() {
        this.instapaperClient.prepareUrl.should.throw('You must provide a url endpoint.');
      });

      test('should return the baseUrl + endpoint if no options are supplied', function() {
        var preparedUrl = this.instapaperClient.prepareUrl('/test/endpoint');
        preparedUrl.should.equal(BASE_URL + '/test/endpoint');
      });

      test('should return the baseUrl + endpoint with all query parameters URL formatted',
      function() {
        this.instapaperClient.prepareUrl('/test/endpoint', {
          param1: 'p1Value',
          '2ndParam': '2ndPValue'
        }).should.equal(BASE_URL + '/test/endpoint?param1=p1Value&2ndParam=2ndPValue');
      });

      test('should prepend a forward slash if none is provided in the endpiont param', function() {
        var preparedUrl = this.instapaperClient.prepareUrl('test/endpoint');
        preparedUrl.should.equal(BASE_URL + '/test/endpoint');
      });
    });

    /**
     * Test the makeRequest() method
     */
    suite('.makeRequest()', function() {
      setup(function() {
        createInstance.bind(this).call();

      });

      test('should be a function', function() {
        this.instapaperClient.makeRequest.should.be.a('function');
      });

      test('should throw if no method is provided', function() {
        this.instapaperClient.makeRequest.should.throw('You must provide a request method.');
      });

      test('should throw if no url is provided', function() {
        (function() {
          this.instapaperClient.makeRequest('GET');
        }.bind(this)).should.throw('You must provide a url.');
      });

      test('should call the callback if provided', function(done) {
        this.instapaperClient.makeRequest('GET', 'http://www.examplehost.com', {}, function() {
          should.ok(true);
          done();
        });
      });

      test('should call the callback if no data is provided', function(done) {
        this.instapaperClient.makeRequest('GET', 'http://www.examplehost.com', function() {
          should.ok(true);
          done();
        });
      });

      test('should throw if no callback is provided', function() {
        (function() {
          this.instapaperClient.makeRequest('GET', 'http://www.examplehost.com');
        }.bind(this)).should.throw('You must provide a callback function.');
      });

      test('should call OAuth.getProtectedResource() with the provided url, method, and data',
      function(done) {
        var client = this.instapaperClient;
        client.makeRequest('GET', 'http://www.example.com', function() {
          client.oauthClient.getProtectedResource.executed.should.be.true;
          client.oauthClient.getProtectedResource.args[0].should.equal('http://www.example.com');
          client.oauthClient.getProtectedResource.args[1].should.equal('GET');
          done();
        });
      });

      suite('request callbacks', function() {
        test('should respond with success if request is successful', function() {
          var client = this.instapaperClient;
          client.makeRequest('GET', '/oauth/access_token', function(err, res) {
            should.not.exist(err);
            should.exist(res);
          });
        });

        test('should forward errors from the oauthClient', function() {
          var client = this.errorClient;
          client.makeRequest('GET', '/oauth/access_token', function(err) {
            should.exist(err);
          });
        });
      });
    });

    /**
     * Test the authenticate() method
     */
    suite('.authenticate()', function() {
      setup(createInstance);

      test('should be a function', function() {
        this.instapaperClient.authenticate.should.be.a('function');
      });

      test('should call the provided callback', function(done) {
        this.instapaperClient.authenticate(function() {
          should.ok(true);
          done();
        });
      });

      test('should throw if no callback is provided', function() {
        this.instapaperClient.authenticate.should.throw('You must provide a callback.');
      });

      test('should respond with error if options is not an object', function(done) {
        this.instapaperClient.authenticate('testUsername', 'testPassword', [], function(err) {
          err.should.equal('options must be an object.')
          done();
        });
      });

      test('should set the OAuth callback url if provided in the options', function(done) {
        var client = this.noOptionsClient;
        client.authenticate('testUsername', 'testPassword', {
          oauthCallbackPath: '/instapaper/callback'
        }, function(err, response) {
          client.oauthCallbackPath.should.equal('/instapaper/callback');
          done();
        });
      });

      test('should respond with error if no OAuth callback is available', function(done) {
        var client = this.noOptionsClient;
        client.authenticate('testUsername', 'testPassword', function(err) {
          err.should.equal('No OAuth callback path provided.');
          done();
        });
      });

      test('should respond with error if the username is not provided as the first param',
      function(done) {
        this.noOptionsClient.authenticate(function(err) {
          err.should.equal('You must provide a username to authenticate.');
          done();
        });
      });

      test('should respond with error if the password is not provided as the second param',
      function(done) {
        this.noOptionsClient.authenticate('testUsername', function(err) {
          err.should.equal('You must provide a password to authenticate.');
          done();
        });
      });

      /**
       * Integration test:
       *   Tests the authenticate() method's integration with the prepareUrl() method
       */
      suite('url setup', function() {
        setup(function() {
          createInstance.bind(this).call();

          this.instapaperClient.prepareUrl = stubFn();
        });

        test('should provide baseUrl for authentication request', function() {
          var client = this.instapaperClient;
          client.authenticate('testUsername', 'testPassword', function() {
            client.prepareUrl.args[0].should.equal('/oauth/access_token');
          });
        });
        test('should have x_auth_username, x_auth_password, and x_auth_mode in the options',
        function() {
          var client = this.instapaperClient;
          client.authenticate('testUsername', 'testPassword', function() {
            client.prepareUrl.args[1].should.have.keys('x_auth_username',
                                                       'x_auth_password',
                                                       'x_auth_mode');
          });
        });

        test('should provide the correct values to the options', function() {
          var client = this.instapaperClient;
          client.authenticate('testUsername', 'testPassword', function() {
            var options = client.prepareUrl.args[1];
            options.x_auth_username.should.equal('testUsername');
            options.x_auth_password.should.equal('testPassword');
            options.x_auth_mode.should.equal('client_auth');
          });
        });
      });

      /**
       * Integration test:
       *   Test the authenticate() method's integration with the makeRequest() method
       */
      suite('OAuth request', function() {

      });
    });

    suite('getUser()', function() {
      setup(createInstance());

      test('should be a function');
      test('should respond with an object');
      test('response object should have a type, user_id, and username');
      test('response object.type should equal "user"');
    });
  });
});