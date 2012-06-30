/**
 * This object mocks responses from the Instapaper API for testing
 *
 * @type {Object}
 */

module.exports = {
  '/oauth/access_token' : {
    success: 'oauth_token=aabbccdd&oauth_token_secret=efgh1234',
    error: 'oauth_timestamp is too far away; we believe it is now 1341088595, ' +
               'you sent 0, 1341088595 seconds away.'
  },
  '/account/verify_credentials': {
    success: {
      type: 'user',
      user_id: '12345678',
      username: 'testUsernameFTW'
    },
    error: ''
  },
  '/bookmark/add': {
    success: '',
    error: ''
  }
};