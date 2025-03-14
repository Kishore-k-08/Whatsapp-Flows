/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree
 */

import express from "express";
import { decryptRequest, encryptResponse, FlowEndpointException } from "./encryption.js";
import { getPincodeScreen } from "./pincode.js";
import crypto from "crypto";
import dotenv from "dotenv-flow";


dotenv.config({
  node_env: process.env.NODE_ENV,
  default_node_env: "development",
});

const app = express();

const {
  APP_SECRET,
  PRIVATE_KEY,
  PASSPHRASE = "test",
  PORT = "3000",
} = process.env;


app.use(
  express.json({
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      console.log(req);
      req.rawBody = buf?.toString(encoding || "utf8");

    },
  }),
);


/*y
Example:
```-----[REPLACE THIS] BEGIN RSA PRIVATE KEY-----
MIIE...
...
...AQAB
-----[REPLACE THIS] END RSA PRIVATE KEY-----```
*/

app.get('/test', (req, res) => {
  console.log("➡️ Received request for APPOINTMENT screen");
    res.send('This is a test responsdcdde(pincode)!');
});

app.get('/flow/APPOINTMENT', (req, res) => {
  console.log("➡️ Received request for APPOINTMENT screen");
   return res.json(SCREEN_RESPONSES.APPOINTMENT);
});

  // if (SCREEN_RESPONSES.APPOINTMENT) {
  //     console.log("✅ Returning APPOINTMENT screen data");
  //     return res.json(SCREEN_RESPONSES.APPOINTMENT);
  // }

  // console.log("❌ APPOINTMENT screen not found!");
  // return res.status(404).json({ error: "APPOINTMENT screen not found" });



app.post("/", async (req, res) => {
  // if (!PRIVATE_KEY) {
  //   throw new Error(
  //     'Private key is empty. Please check your env variable "PRIVATE_KEY".'
  //   );
  // }

  // if(!isRequestSignatureValid(req)) {
  //   // Return status code 432 if request signature does not match.
  //   // To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
  //   return res.status(432).send();
  // }

  let decryptedRequest = null;
  try {
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  }
   catch (err) {
    console.error(err);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
  console.log("💬 Decrypted Request:", decryptedBody);

  // TODO: Uncomment this block and add your flow token validation logic.
  // If the flow token becomes invalid, return HTTP code 427 to disable the flow and show the message in `error_msg` to the user
  // Refer to the docs for details https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes

  /*
  if (!isValidFlowToken(decryptedBody.flow_token)) {
    const error_response = {
      error_msg: `The message is no longer available`,
    };
    return res
      .status(427)
      .send(
        encryptResponse(error_response, aesKeyBuffer, initialVectorBuffer)
      );
  }
  */

  const screenResponse = await getPincodeScreen(decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);

  res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${APP_SECRET} mode`);

});


function isRequestSignatureValid(req) {
  if(!APP_SECRET) {
    console.warn("App Secret is not set up. Please Add your app secret in /.env file to check for request validation");
    return true;
  }

  const signatureHeader = req.get("x-hub-signature-256");
  const signatureBuffer = Buffer.from(signatureHeader.replace("sha256=", ""), "utf-8");

  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest('hex');
  const digestBuffer = Buffer.from(digestString, "utf-8");

  if ( !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    console.error("Error: Request Signature did not match");
    return false;
  }
  return true;
}
