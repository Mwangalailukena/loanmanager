const {setGlobalOptions} = require("firebase-functions");
const onRequest = require("firebase-functions/https").onRequest;
const logger = require("firebase-functions/logger");

const _onRequest = onRequest;
const _logger = logger;

setGlobalOptions({maxInstances: 10});

exports.helloWorld = _onRequest((request, response) => {
  _logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

