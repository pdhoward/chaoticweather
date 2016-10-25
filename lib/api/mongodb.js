
'use strict';


//////////////////////////////////////////////////////////////////////////
///////////////////////////// Mongodb Functions /////////////////////////
////////////////////////////////////////////////////////////////////////

var extend =          require('extend');
var setup =           require('../../setup');
var mongoose =        require('mongoose');

var messageSchema = mongoose.Schema({
    userID: String,
    context: Object

});

var botdb = mongoose.model('Text', messageSchema);
var dbURI =  setup.SERVER.DB;

module.exports = {
  /**
   * Returns an element by id or undefined if it doesn't exists
   * @param  {[type]}   params._id The user id
   * @param  {Function} callback The callback
   * @return {void}
   */


  get: function(params, callback) {

    console.log("-------------------------------".green);
    console.log("ENTERED Mongodb GET".green);
    console.log({params: params});

    botdb.findOne({userID: params}, function(err, response) {
      if (err) {
        if (err.error !== 'not_found') {
          return callback(err);
        } else {
          return callback(null);
        }
      } else {

        console.log("-------------------------------".green);
        console.log("Mongodb GET RESULT".green);
        console.log({response: response});

        return callback(null, response);

      }
    });
  },
  /**
   * Inserts an element in the database
   * @param  {[type]}   params._id The user id
   * @param  {Function} callback The callback
   * @return {void}
   */
  put: function(params, callback) {

    console.log("-------------------------------".green);
    console.log("Mongodb PUT RECORD ENTERED".green);
    console.log({params: params});

//    var newRecord = new botdb(params);
//    newRecord.isNew = false;

//    newRecord.save(function(err){
    botdb.findOneAndUpdate(params.userID, params, {upsert: true, setDefaultsOnInsert:true}, function(err) {
      if (err) {
          return callback(err);
        } else {
        console.log("-------------------------------".green);
        console.log("Mongodb RESULT SAVED".green);
        return callback(null);
        }

    });
  }
};
