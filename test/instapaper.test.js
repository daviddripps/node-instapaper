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

//a setup function to create a new instance of the Instapaper class in the test's scope
//it also creates a client without any options and one that responds with an error
function createInstance() {
  //no options client
  this.noOptionsClient = new Instapaper('testConsumerKey', 'testConsumerSecret');

  //normal success client
  this.instapaperClient = new Instapaper('testConsumerKey', 'testConsumerSecret', {
    username: 'testUsername',
    password: 'testPassword'
  });

  var realOauthClient = this.instapaperClient._oauthClient;

  this.instapaperClient._oauthClient = Object.create(realOauthClient);
  this.instapaperClient._oauthClient.post = (function() {
    var fn = function(url, consumerKey, consumerSecret, post_body, cb) {
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
  }());

  this.instapaperClient._restler = (function() {
    return {
      post: function() {
        return this;
      },
      on: function(event, cb) {
        if(event == 'success') cb('oauth_token=K1S0vgSqfB1AhZ0mXpUHaEDuLsCaybtDnWgu8xZ0LpexWPxO' +
                                 '&oauth_token_secret=UOaKOCzlsagWnmR2u86DEwpP7qoOi67FtCui1y3jEC');
        else
          cb();

        return this;
      }
    };
  }());

  //create a client that will respond with an error in the callback
  this.errorClient = new Instapaper('testConsumerKey', 'testConsumerSecret', {
    oauthCallbackPath: '/instapaper/callback',
    username: 'testUsername',
    password: 'testPassword'
  });

  this.errorClient._oauthClient = Object.create(realOauthClient);
  this.errorClient._oauthClient.post = (function() {
    var fn = function(url, consumerKey, consumerSecret, post_body, cb) {
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
  }());

  this.errorClient._restler = (function() {
    return {
      post: function() {
        return this;
      },
      on: function(event, cb) {
        if(event == 'error') cb('Invalid xAuth credentials.');
        else cb();

        return this;
      }
    };
  }());
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

    test('should set the accessToken if provided in the options');
    test('should set the accessTokenSecret if provided in the options');
    test('should throw error if accessToken XOR accessTokenSecret in the options');

    test('should not throw if no options are provided', function() {
      (function() {
        var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
      }.bind(this)).should.not.throw();
    });

    test('should create a _restler instance for the authenticate() method');

    test('should create an _oauthClient if valid consumer key and secret are provided', function() {
      var client = new Instapaper('testConsumerKey', 'testConsumerSecret');
      client._oauthClient.should.be.a('object');
      client._oauthClient._consumerKey.should.equal('testConsumerKey');
      client._oauthClient._consumerSecret.should.equal('testConsumerSecret');
    });

    /**
     * Test the _prepareUrl() method
     */
    suite('._prepareUrl()', function() {
      setup(createInstance);

      test('should be a function', function() {
        this.instapaperClient._prepareUrl.should.be.a('function');
      });

      test('should throw if no endpoint is provided', function() {
        this.instapaperClient._prepareUrl.should.throw('You must provide a url endpoint.');
      });

      test('should return the baseUrl + endpoint if no options are supplied', function() {
        var preparedUrl = this.instapaperClient._prepareUrl('/test/endpoint');
        preparedUrl.should.equal(BASE_URL + '/test/endpoint');
      });

      test('should return the baseUrl + endpoint with all query parameters URL formatted',
      function() {
        this.instapaperClient._prepareUrl('/test/endpoint', {
          param1: 'p1Value',
          '2ndParam': '2ndPValue'
        }).should.equal(BASE_URL + '/test/endpoint?param1=p1Value&2ndParam=2ndPValue');
      });

      test('should prepend a forward slash if none is provided in the endpiont param', function() {
        var preparedUrl = this.instapaperClient._prepareUrl('test/endpoint');
        preparedUrl.should.equal(BASE_URL + '/test/endpoint');
      });
    });

    /**
     * Test the _makeRequest() method
     */
    suite('._makeRequest()', function() {
      setup(function() {
        createInstance.bind(this).call();

      });

      test('should be a function', function() {
        this.instapaperClient._makeRequest.should.be.a('function');
      });

      test('should throw if no url is provided', function() {
        (function() {
          this.instapaperClient._makeRequest();
        }.bind(this)).should.throw('You must provide a url.');
      });

      test('should call the callback if provided', function(done) {
        this.instapaperClient._makeRequest('http://www.examplehost.com', {}, function() {
          should.ok(true);
          done();
        });
      });

      test('should call the callback if no data is provided', function(done) {
        this.instapaperClient._makeRequest('http://www.examplehost.com', function() {
          should.ok(true);
          done();
        });
      });

      test('should throw if no callback is provided', function() {
        (function() {
          this.instapaperClient._makeRequest('http://www.examplehost.com');
        }.bind(this)).should.throw('You must provide a callback function.');
      });

      test('should call OAuth.post() for requests with the correct params',
      function(done) {
        var client = this.instapaperClient;
        client._makeRequest('http://www.example.com', function() {
          client._oauthClient.post.executed.should.be.true;
          client._oauthClient.post.args[0].should.equal('http://www.example.com');
          client._oauthClient.post.args[1].should.equal('testConsumerKey');
          client._oauthClient.post.args[2].should.equal('testConsumerSecret');
          done();
        });
      });

      suite('request callbacks', function() {
        test('should respond with success if request is successful', function() {
          var client = this.instapaperClient;
          client._makeRequest('/oauth/access_token', function(err, res) {
            should.not.exist(err);
            should.exist(res);
          });
        });

        test('should forward errors from the _oauthClient', function() {
          var client = this.errorClient;
          client._makeRequest('/oauth/access_token', function(err) {
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
       *   Tests the authenticate() method's integration with the _prepareUrl() method
       */
      test('should call _prepareUrl() with the correct endpoint for an authentication request',
      function(done) {
        var client = this.instapaperClient;
        client._prepareUrl = stubFn('http://www.instapaper.com/api/1/oauth/access_token');
        client.authenticate('testUsername', 'testPassword', function() {
          client._prepareUrl.args[0].should.equal('/oauth/access_token');
          done();
        });
      });

      /**
       * Integration tests:
       *   Test the authenticate() method's integration with the Restler object
       */
      suite('OAuth request', function() {
        setup(createInstance);

        test('should respond with object containing the OAuth token and secret if successful',
        function(done) {
          this.instapaperClient.authenticate('testUsername', 'testPassword', function(err, data) {
            should.not.exist(err);
            data.should.have.keys('oauth_token', 'oauth_token_secret');
            (typeof data.oauth_token).should.be.a('string');
            (typeof data.oauth_token_secret).should.be.a('string');
            done();
          });
        });

        test('should set the instance accessToken and accessTokenSecret if successful');

        test('should respond with error if unsuccessful', function(done) {
          this.errorClient.authenticate('testUsername', 'testPassword', function(err, data) {
            err.should.equal('Invalid xAuth credentials.');
            done();
          });
        });
      });
    });

    suite('.getUser()', function() {
      setup(createInstance());

      test('should be a function');
      test('should call the provided callback');
      test('should throw if no callback is provided');
      test('should respond with an error if the accessToken or accessTokenSecret is not provided');
      test('should call _prepareUrl() with the correct endpoint');

      suite('OAuth request', function() {
        setup(createInstance);

        test('response object should have a type, user_id, and username on success');
        test('response object.type should equal "user" on success');
        test('should respond with an error if unsuccessful');
      });
    });

    suite('.addBookmark()', function() {
      setup(createInstance());

      test('should be a function');
      test('should call the provided callback');
      test('should throw if no callback is provided');
      test('should respond with an error if no accessToken or accessTokenSecret is provided');
      test('should respond with an error if no url is provided');
      test('should call _prepareUrl() with the correct endpoint');

      suite('OAuth request', function() {
        setup(createInstance);

        test('should send url with request');
        test('should send title with request if provided');
        test('should send description with request if provided');
        test('should send folder_id with request if provided');
        test('should send resolve_final_url with request if provided');
        test('should have a type, user_id, and username in the response object on success');
        test('should have a "type" key equal to "user" in the response object on success');
        test('should respond with an error if unsuccessful');
      });
    });
  });
});