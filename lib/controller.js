
'use strict';


//////////////////////////////////////////////////////////////////////////
/////////////////////////////     Controller    /////////////////////////
////////////////////////////////////////////////////////////////////////

var debug =                 require('debug')('bot:controller');
var extend =                require('extend');
var Promise =               require('bluebird');
var conversation =          require('./api/conversation');
var weather =               require('./api/weather');
var alchemyLanguage =       require('./api/alchemy-language');
var mongodb =               require('./api/mongodb');
var format =                require('string-template');
var pick =                  require('object.pick');
var colors =                require('colors');

var sendMessageToConversation = Promise.promisify(conversation.message.bind(conversation));
var getUser = Promise.promisify(mongodb.get.bind(mongodb));
var saveUser = Promise.promisify(mongodb.put.bind(mongodb));
var extractCity = Promise.promisify(alchemyLanguage.extractCity.bind(alchemyLanguage));
var getForecast = Promise.promisify(weather.forecastByGeoLocation.bind(weather));
var getGeoLocation = Promise.promisify(weather.geoLocation.bind(weather));


module.exports = {
  /**
   * Process messages from a channel and send a response to the user
   * @param  {Object}   message.user  The user
   * @param  {Object}   message.input The user meesage
   * @param  {Object}   message.context The conversation context
   * @param  {Function} callback The callback
   * @return {void}
   */
  processMessage: function(_message, callback) {
    var message = extend({ input: {text: _message.text} }, _message);
    var input = message.text ? { text: message.text } : message.input;
    var user = message.user || message.from;

    console.log("-------------------------------".green);
    console.log("ENTERED PROCESS MESSAGES".green);
    console.log({message: message});

    debug('1. Process new message: %s.', JSON.stringify(message.input, null, 2));

    getUser(user).then(function(dbUser) {
      var context = dbUser ? dbUser.context : {};
      message.context = context;

      console.log("-------------------------------".green);
      console.log("PROCESS MESSAGE Step 1 - DBUSER".green);
      console.log({message: message});
      console.log({input: input});
      console.log({dbUser: dbUser});

      return extractCity(input)

      .then(function(city) {
        debug('2. input.text: %s, extracted city: %s.', input.text, JSON.stringify(city, null, 2));

        console.log("-------------------------------".green);
        console.log("PROCESS MESSAGE Step 2 - extract City".green);
        console.log({city: city});


        if (city) {
          if (!context.city) {
            context.city = city
            }
          context.city.alternate_name = city.name;
          }
        })

        .then(function() {

          console.log("-------------------------------".green);
          console.log("FINISHED STEP 2 - DISPLAY STATUSES".green);
          console.log({message: message});
          console.log({context: message.context});

          if (context.city && !context.state) {
            return getGeoLocation(context.city)

          .then(function(geoLocatedCity) {
            debug('3. Geo location for: %s, is: %s.',
              context.city.name, JSON.stringify(geoLocatedCity, null, 2));


              console.log("-------------------------------".green);
              console.log("PROCESS MESSAGE Step 3 - geolocation".green);
              console.log({weatherlocale: geoLocatedCity});

            extend(context.city, geoLocatedCity);
            context.city.number_of_states = Object.keys(context.city.states).length;
            if (context.city.number_of_states === 1) {
              context.state = Object.keys(context.city.states)[0];
            }
          });
        } else {
          debug('3. Skip Geo location because city is unknown.');
        }
      })
      .then(function() {
        debug('4. Send message to Conversation.');

        console.log("-------------------------------".green);
        console.log("FINISHED STEP 4 - Sending Context to Watson".green);
        console.log({message: message});
        console.log({context: message.context});
        return sendMessageToConversation(message);
      })
      // 4. Process the response from Conversation
      .then(function(messageResponse) {
        debug('5. Conversation response: %s.', JSON.stringify(messageResponse, null, 2));
        // Check if this is a new weather query
        var responseContext = messageResponse.context;
        var idx = messageResponse.intents.map(function(x) {return x.intent; }).indexOf('get_weather');

        console.log("-------------------------------".green);
        console.log("Process Message Step 5: Conversation Response".green);
        console.log({message: messageResponse});
        console.log({context: messageResponse.context})

        if (responseContext.new_city) { // New weather query
          debug('Replace city name');
          console.log("-------------------------------".green);
          console.log("Process Step 5: Detected New City".green);
          console.log({context: responseContext})


          responseContext.city.name = responseContext.city.alternate_name;
          delete responseContext.weather_conditions;
          delete responseContext.state;
          delete responseContext.get_weather;
          delete responseContext.new_city;
          return getGeoLocation(responseContext.city)

          .then(function(geoLocatedCity) {
            extend(responseContext.city, geoLocatedCity);
            responseContext.city.number_of_states = Object.keys(responseContext.city.states).length;
            if (responseContext.city.number_of_states === 1) {
              responseContext.state = Object.keys(responseContext.city.states)[0];
            }
            message = {
              input: messageResponse.input,
              context: responseContext
            }
          })

          .then(function() {
            console.log("-------------------------------".green);
            console.log("Process Message Step 6: Send Watson Next Message".green);
            console.log({message: message});
            console.log({context: message.context})

            return sendMessageToConversation(message);
          })
        } else {
          return messageResponse;
        }
      })

      .then(function(messageResponse) {
        if (!messageResponse.context.get_weather) {
          debug('6. Not enough information to search for forecast.');
          return messageResponse;
        }

        // BEGIN update context for get_weather
        var loc = {
          city: messageResponse.context.city.name,
          state: messageResponse.context.state
        };
        var gLocation = messageResponse.context.city.states[loc.state];

        // Handle error for invalid state - TODO : More graceful handling in dialog
        if (!gLocation) {
          messageResponse.input = "Hello";
          return sendMessageToConversation(messageResponse);
        }
        messageResponse.context.city.states = pick(messageResponse.context.city.states, loc.state)
        messageResponse.context.city.number_of_states = 1
        delete messageResponse.context.get_weather;
        // END update context for get_weather

        console.log("-------------------------------".green);
        console.log("Process Message Step 7: Getting Weather".green);
        console.log({location: loc});
        console.log({glocation: gLocation})

        return getForecast(gLocation)
        .then(function(forecast) {
          debug('6. Got forecast for %s', loc.city);
          messageResponse.context.weather_conditions = forecast;

          console.log("-------------------------------".green);
          console.log("Process Message Step 8: Sending Forecast to Watson".green);
          console.log({message: messageResponse});
          console.log({forecast:messageResponse.context.weather_conditions })
          return sendMessageToConversation(messageResponse);
        })
      })

      .then(function(messageToUser) {
        debug('7. Save conversation context.');
        if (!dbUser) {
          dbUser = {userID: user};
        }
        dbUser.context = messageToUser.context;
        return saveUser(dbUser)

        .then(function(data) {
          debug('7. Send response to the user.');
          messageToUser = extend(messageToUser, _message);
          callback(null, messageToUser);
        });
      })
    })
    // Catch any issue we could have during all the steps above
    .catch(function (error) {

      console.log("-------------------------------".green);
      console.log("PROCESS MESSAGE CATCH ERROR".green);
      console.log({error: error});

      debug(error);
      callback(error);
    });
  }
}
