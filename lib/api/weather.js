
'use strict';



//////////////////////////////////////////////////////////////////////////
///////////////////      Weather Insights API           /////////////////
////////////////////////////////////////////////////////////////////////

var debug = require('debug')('bot:api:weather');
var pick = require('object.pick');
var format = require('string-template');
var extend = require('extend');
var fields = ['temp', 'pop', 'uv_index', 'narrative', 'phrase_12char', 'phrase_22char', 'phrase_32char'];
var requestDefaults = {
  auth: {
    username: process.env.WEATHER_USERNAME,
    password: process.env.WEATHER_PASSWORD,
    sendImmediately: true
  },
  jar: true,
  json: true
};
var requestNoAuthDefaults = {
  jar: true,
  json: true
};
var weatherKey = process.env.WEATHER_API_KEY;
var request;
var WEATHER_URL = process.env.WEATHER_URL || 'https://twcservice.mybluemix.net/api/weather';

module.exports = {
  /**
   * Returns the Geo location based on a city name
   * @param  {string}   params.name  The city name
   * @param  {Function} callback The callback
   * @return {void}
   */
  geoLocation: function(params, callback) {
    if (!params.name) {
      callback('name cannot be null')
    }

    console.log("-------------------------------".green);
    console.log("ENTERED Weather Service".green);
    console.log({params: params});
    console.log({weatherkey: weatherKey})

    // If API Key is not provided use auth. credentials from Bluemix
    var qString;
    if (!weatherKey) {
        request = require('request').defaults(requestDefaults);
        qString = {
                query: params.name,
                locationType: 'city',
                countryCode: 'US',
                language: 'en-US'
                };
     }else{
        request = require('request').defaults(requestNoAuthDefaults);
        qString = {
                    query: params.name,
                    locationType: 'city',
                    language: 'en-US',
                    countryCode: 'US',
                    apiKey: weatherKey,
                    format : 'json'
                  };
     }

     console.log("-------------------------------".green);
     console.log("Weather Service SEARCH ARGUMENT".green);
     console.log({weatherurl: WEATHER_URL});
     console.log({qstring: qString})


    request({
      method: 'GET',
      url: WEATHER_URL + '/api/weather/v3/location/search',
      qs: qString
    }, function(err, response, body) {
      if (err) {
        callback(err);
      } else if(response.statusCode != 200) {
        callback('Error http status: ' + response.statusCode);
      } else if (body.errors && body.errors.length > 0){
        callback(body.errors[0].error.message);
      } else {
        debug('geoLocation for: %s is: %', params.name, JSON.stringify(body.location));

        var location = body.location;
        if (location.length > 0 ) {
          location = location[0];
        }
        var statesByCity = { };

        location.adminDistrict.forEach(function(state, i) {
          // Avoid duplicates
          if (!statesByCity[state]){
          statesByCity[state] = {
            longitude: location.longitude[i],
            latitude: location.latitude[i]
          };
        };
        });
        callback(null, { states: statesByCity });
      }
    });
  },

/**
 * Gets the forecast based on a location and time range
 * @param  {[string]}   params.latitute   The Geo latitude
 * @param  {[string]}   params.longitude   The Geo longitude
 * @param  {[string]}   params.range   (Optional) The forecast range: 10day, 48hour, 5day...
 * @param  {Function} callback The callback
 * @return {void}
 */
  forecastByGeoLocation : function(params, callback) {
    var _params = extend({ range: '7day' }, params);

    if (!_params.latitude || !_params.longitude) {
      callback('latitude and longitude cannot be null')
    }
       var qString;
       if (!weatherKey) {
            request = require('request').defaults(requestDefaults);
            qString = {
                     units: 'e',
                     language: 'en-US'
                     };
         } else {
            request = require('request').defaults(requestNoAuthDefaults);
             qString = {
                     units: 'e',
                     language: 'en-US',
                     apiKey: weatherKey
                     };
          }
     request({
      method: 'GET',
      url: format(WEATHER_URL + '/api/weather/v1/geocode/{latitude}/{longitude}/forecast/daily/{range}.json', _params),
      qs: qString
    }, function(err, response, body) {
      if (err) {
        callback(err);
      } else if(response.statusCode != 200) {
        callback('Error getting the forecast: HTTP Status: ' + response.statusCode);
      } else {
        var forecastByDay = {};
        body.forecasts.forEach(function(f) {
          if (!forecastByDay[f.dow]) {
          forecastByDay[f.dow] = {
            day: pick(f.day, fields),
            night: pick(f.night, fields)
          };
        };
        });
        debug('forecast for: %s is: %s', JSON.stringify(params), JSON.stringify(forecastByDay, null, 2));
        callback(null, forecastByDay);
      }
    });
  }
}
