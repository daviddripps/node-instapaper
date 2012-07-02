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
  '/bookmarks/add': {
    success: '[{"type":"bookmark","bookmark_id":299276832,"url":"http:\/\/www.daviddripps.com",' +
               '"title":"David Dripps","description":"","time":1341205558,"starred":"0",' +
               '"private_source":"","hash":"pNIo07VD","progress":0,"progress_timestamp":0}]',
    error: {
      statusCode: 403,
      data: '[{"type":"error","error_code":403,"message":"Not logged in"}]'
    }
  }
};