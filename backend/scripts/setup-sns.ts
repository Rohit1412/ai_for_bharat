/**
 * Creates SNS topic and optional email subscription for ClimateAI alerts.
 * Run: npx ts-node backend/scripts/setup-sns.ts [email@example.com]
 *
 * Requires: AWS credentials configured (aws configure or env vars)
 * Region: ap-south-1
 */

import {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";

const REGION = process.env.AWS_REGION ?? "ap-south-1";
const TOPIC_NAME = "viriva-alerts-dev";
const client = new SNSClient({ region: REGION });

async function main() {
  console.log(`Setting up SNS in ${REGION}...\n`);

  // Create topic (idempotent)
  let topicArn: string;
  try {
    const res = await client.send(new CreateTopicCommand({ Name: TOPIC_NAME }));
    topicArn = res.TopicArn!;
    console.log(`  ✓ Topic: ${topicArn}`);
  } catch (e) {
    console.error(`  ✗ CreateTopic — ${(e as Error).message}`);
    process.exit(1);
  }

  // Add email subscription if provided as CLI arg
  const email = process.argv[2];
  if (email) {
    try {
      const subs = await client.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );
      const already = subs.Subscriptions?.some(s => s.Endpoint === email);
      if (already) {
        console.log(`  ✓ ${email} — already subscribed`);
      } else {
        await client.send(
          new SubscribeCommand({ TopicArn: topicArn, Protocol: "email", Endpoint: email })
        );
        console.log(`  ✓ Subscription confirmation sent to ${email}`);
      }
    } catch (e) {
      console.error(`  ✗ Subscribe — ${(e as Error).message}`);
    }
  }

  console.log(`
SNS setup complete.
Add to your .env:
  VITE_SNS_TOPIC_ALERTS=${topicArn}
`);
}

main().catch(console.error);
