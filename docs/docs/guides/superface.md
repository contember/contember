---
title: Using Contember Actions with Superface AI
---

import DocsCard from '../../src/components/global/DocsCard';
import DocsCards from '../../src/components/global/DocsCards';

In this example, we'll set up notifications for new articles to be sent to Slack. Assuming you've already prepared an Action as per our [Actions tutorial](/intro/actions), the next step is to construct a simple Node.js app to receive the payload from the Action and then send a notification to Slack.

We'll be following the [guide provided by Superface AI](https://superface.ai/docs/api-examples/slack) step by step. One of the key advantages of Superface AI is that it generates the code we need, meaning there's no need to delve into the Slack API documentation.

Superface AI is designed to aid in building your integration, but it doesn't limit where you can run it. You can operate it anywhere you like and manage version control via Git.

Start by installing their CLI and specifying Slack as the platform to work with.

```bash
npm i -g @superfaceai/cli@latest
```

```bash
superface prepare https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json slack
```

Next, let's specify our objective: sending messages to a Slack channel.

```bash
superface new slack "send message to channel"
```

The CLI will then instruct us to run the map command. Please note your file names may differ from ours and running the commands the CLI outputs is the way to go.

```bash
superface map slack chat-communication/post-message
```

Once that's done, you'll need the Slack API token. This part can be a bit tricky. You can find a guide on Slack's website that explains the process, but in brief, you need to create a testing app, install it to your workspace, and then return to the tutorial. Your token, which should begin with xoxb-, will be displayed there. Add this token to your .ENV file.

Now, in the generated file `chat-communication.post-message.slack.mjs`, update the channel name to the one where you want to send your test message and run:

```bash
superface execute slack chat-communication/post-message
```

And there you have it, your message appears in Slack as if by magic!


The final step is to replace the dummy data in your file with actual variables. Your finished code might look like this:

```javascript
import { config } from 'dotenv';
import express from 'express';
import { OneClient, PerformError, UnexpectedError } from '@superfaceai/one-sdk/node/index.js';

// Load environment variables from .env file
config();

const client = new OneClient({
  token: process.env.SUPERFACE_ONESDK_TOKEN,
  assetsPath: '/superface-slack/superface'
});

const profile = await client.getProfile('chat-communication/post-message');
const useCase = profile.getUseCase('SendChannelMessage')

// Setup Express server
const app = express();
app.use(express.json()); // for parsing application/json

// POST endpoint for receiving payload
app.post('/payload', async (req, res) => {
  const { events } = req.body;

  for (const event of events) {
    const { id, entity, values, operation } = event;

    if (operation === 'create' && entity === 'Article') {
      try {
        const result = await useCase.perform(
          {
            channel: 'random',
            text: `New article with ${values.title} created`,
            as_user: true,
            attachments: [],
            blocks: [],
          },
          {
            provider: 'slack',
            parameters: {},
            security: { slackBearerToken: { token: process.env.SLACK_TOKEN } }
          }
        );

        console.log("RESULT:", JSON.stringify(result, null, 2));

      } catch (e) {
        if (e instanceof PerformError) {
          console.log('ERROR RESULT:', e.errorResult);
          res.status(500).send({ message: 'Perform Error', error: e.errorResult });
          return;
        } else if (e instanceof UnexpectedError) {
          console.error('ERROR:', e);
          res.status(500).send({ message: 'Unexpected Error', error: e.message });
          return;
        } else {
          throw e;
        }
      }
    } else {
      res.status(400).send({ message: 'Invalid payload' });
      return;
    }
  }

  res.status(200).send({ message: 'Messages sent successfully' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

In this updated code, an Express server is set up with a POST endpoint `/payload`. When you send a POST request to this endpoint with the payload, it will check if the operation is `create` and entity is `Article`. If it is, it sends a message to the `random` channel with the text `New article with {values.title} created`. If the operation is not `create` or the entity is not `Article`, it will return a 400 status code with a message `Invalid payload`.

---

This was a very simple example and you might want to solve it differently. Where we think Superface AI is powerful is that it'll allow you to quickly integrate many different APIs. Some of the examples in their documentations:

<DocsCards>
  <DocsCard header="Hubspot" href="https://superface.ai/docs/api-examples/hubspot">
	<p>Produce a working use case that lists the companies in a HubSpot CRM</p>
  </DocsCard>
  <DocsCard header="Infobip" href="https://superface.ai/docs/api-examples/infobip">
	<p>Produce a working use case that can send an SMS message to any number.</p>
  </DocsCard>
  <DocsCard header="Lob" href="https://superface.ai/docs/api-examples/lob">
	<p>Produce a working use case that adds a new address that can be used to send postcards, letters, and even checks.</p>
  </DocsCard>
  <DocsCard header="Notion" href="https://superface.ai/docs/api-examples/notion">
	<p>Produce a working use case that allows you to list all of the users in your Notion workspace.</p>
  </DocsCard>
  <DocsCard header="PagerDuty" href="https://superface.ai/docs/api-examples/pagerduty">
	<p>Produce a working use case that lists the most recent reported incidents.</p>
  </DocsCard>
  <DocsCard header="Resend" href="https://superface.ai/docs/api-examples/resend">
	<p>Produce a working use case that allows you to send an email from an application.</p>
  </DocsCard>
</DocsCards>