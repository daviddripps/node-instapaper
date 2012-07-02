/**
 * This object mocks responses from the Instapaper API for testing
 *
 * @type {Object}
 */

module.exports = {
  '/oauth/access_token' : {
    success: 'oauth_token=testAccessToken&oauth_token_secret=testAccessTokenSecret',
    error: 'oauth_timestamp is too far away; we believe it is now 1341088595, ' +
               'you sent 0, 1341088595 seconds away.'
  },
  '/account/verify_credentials': {
    success: [ {
      type: 'user',
      user_id: '12345678',
      username: 'testUsernameFTW'
    } ],
    error: {
      statusCode: 403,
      data: '[{"type":"error","error_code":403,"message":"Not logged in"}]'
    }
  },
  '/bookmark/add': {
    success: '',
    error: ''
  }
};