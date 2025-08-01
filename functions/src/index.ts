import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

const _onRequest = onRequest;
const _logger = logger;

setGlobalOptions({maxInstances: 10});

// Example function (uncomment to use)
// export const helloWorld = _onRequest((request, response) => {
//   _logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

