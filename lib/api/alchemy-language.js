
'use strict';



//////////////////////////////////////////////////////////////////////////
//////////// Alchemy used to validate location entities /////////////////
////////////////////////////////////////////////////////////////////////

var AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');
var alchemyLanguage = new AlchemyLanguageV1({
  api_key: process.env.ALCHEMY_API_KEY
});
var debug = require('debug')('bot:api:alchemy-language');

/**
 * Returns true if the entity.type is a city
 * @param  {Object}  entity Alchemy entity
 * @return {Boolean}        True if entity.type is a city
 */
function isCity(entity) {
   return entity.type === 'City';
}

/**
 * Returns only the name property
 * @param  {Object}  entity Alchemy entity
 * @return {Object}  Only the name property
 */
function onlyName(entity) {
  return { name: entity.text };
}

module.exports = {
  /**
   * Extract the city mentioned in the input text
   * @param  {Object}   params.text  The text
   * @param  {Function} callback The callback
   * @return {void}
   */
  extractCity: function(params, callback) {
    params.language = 'english';
    alchemyLanguage.entities(params, function(err, response) {
      debug('text: %s, entities: %s', params.text, JSON.stringify(response.entities));
      if (err) {
        callback(err);
      }
      else {
        var cities = response.entities.filter(isCity).map(onlyName);
        callback(null, cities.length > 0 ? cities[0]: null);
      }
    })
  }
};
