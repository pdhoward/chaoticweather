
'use strict';


//////////////////////////////////////////////////////////////////////////
/////////////////////////////   Web UI Bot      /////////////////////////
////////////////////////////////////////////////////////////////////////


var debug = require('debug')('bot:channel:web-ui');

module.exports = function (app, controller) {
  debug('web-ui initialized');
  app.post('/api/message', function(req, res, next) {

    console.log("-------------------------------".green);
    console.log("ENTERED WEB UI".green);
    console.log({reqparams: req.body});

    if (!process.env.WORKSPACE_ID) {
      res.status(400).json({error: 'WORKSPACE_ID cannot be null', code: 500});
      return;
    }

    debug('message: %s', JSON.stringify(req.body));
    controller.processMessage(req.body, function(err, response) {
      if (err) {
        res.status(err.code || 400).json({error: err.error || err.message});
      } else {
        res.json(response);
      }
    })
  });
}
