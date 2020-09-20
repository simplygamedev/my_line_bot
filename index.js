'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

const crypto = require('crypto');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', 
  line.middleware(config), 
  (req, res, next)=>{

    const signature = crypto
      .createHmac('SHA256', config.channelSecret)
      .update(JSON.stringify(req.body)).digest('base64');

      // Compare X-Line-Signature request header and the signature
      console.log(signature, req.headers['x-line-signature']);
      if(signature === req.headers['x-line-signature'])
        next();
      
      console.error('Invalid Message Signature In Request');
      res.end();
  }, 
  (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.status(200).json(result))
      .catch((err) => {
        console.error(err);
        res.status(500).end();
      });
  }
);

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo = { type: 'text', text: 'Echo from Server: ' + event.message.text};

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});