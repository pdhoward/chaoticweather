
'use strict';



//////////////////////////////////////////////////////////////////////////
////////////////// Watson Conversation API      /////////////////////////
////////////////////////////////////////////////////////////////////////

var extend = require('extend');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var conversation = new ConversationV1({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  version_date: '2016-07-01',
  path: {
    workspace_id: process.env.WORKSPACE_ID
  }
});
var debug = require('debug')('bot:api:conversation');

/**
* Converts a day number to a string.
*
* @method dayOfWeekAsString
* @param {Number} dayIndex
* @return {Number} Returns day as number
*/
function dayOfWeekAsString(dayIndex) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex % 7];
}

module.exports = {
  /**
   * Sends a message to the conversation. If context is null it will start a new conversation
   * @param  {Object}   params   The conversation payload. See: http://www.ibm.com/watson/developercloud/conversation/api/v1/?node#send_message
   * @param  {Function} callback The callback
   * @return {void}
   */
  message: function(params, callback) {
    // 1. Set today and tomorrow's day of the week
    var now = new Date();
    var context = {
      today: dayOfWeekAsString(now.getDay()),
      tomorrow: dayOfWeekAsString(now.getDay() + 1)
    };

    var _params = extend({}, params);
    if (!_params.context) {
      _params.context = {};
      _params.context.system = {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1
      }
    }
    var newMessage = extend(true, _params, {context: context});
    conversation.message(newMessage, function(err, response) {
      debug('message:', newMessage);
      if (err) {
        callback(err);
      } else {
        debug('response:', response);
        callback(null, response);
      }
    });
  }
}
