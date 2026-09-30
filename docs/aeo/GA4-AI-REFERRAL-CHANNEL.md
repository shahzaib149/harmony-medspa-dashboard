# GA4: "AI Referral" channel for AI search tools

Groups visits from AI assistants into their own channel so GA4 reports show them
separately from ordinary referrals.

- **Property:** harmonymedspafl.com (GA4 property 433407977)
- **Who can do it:** an Editor or Administrator on the property
- **Effect on data:** applies to past and future data, in reports that use this channel group. Nothing is deleted.

## Why this is a group plus a channel

GA4 does not let you edit the built-in "Default channel group". You create your own
**channel group** and add an **AI Referral** channel inside it.

Channel rules are evaluated from top to bottom, and the first match wins. The AI
Referral channel therefore has to sit **above** the built-in "Referral" channel.
Otherwise ChatGPT and Perplexity visits are counted as ordinary referrals before the
AI rule is reached.

## Steps

1. Open [analytics.google.com](https://analytics.google.com) and select the **Harmony Med Spa** property.
2. Click **Admin** (the gear icon, bottom left).
3. In the **Property** column, open **Data display** and click **Channel groups**.
4. Click **Create new channel group**.
5. In **Channel group name**, enter `Harmony channels`. Optionally add the description "Default channels plus AI Referral".
   - The new group starts as a copy of the default channels, which keeps Organic Search, Paid Search, Referral and the rest.
6. Click **Add new channel**.
7. In **Channel name**, enter `AI Referral`.
8. Under **Conditions**, set:
   - **Dimension:** `Source`
   - **Match type:** `matches regex`
   - **Value:** `(^|\.)(chatgpt\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai|you\.com)$`
9. Click **Save channel**.
10. In the channel list, click **Reorder** and drag **AI Referral** above **Referral**. Putting it at or near the top is simplest.
11. Click **Save group**.

## Using it in reports

1. Go to **Reports**, then **Acquisition**, then **Traffic acquisition**.
2. In the dimension dropdown above the table ("Session primary channel group…"), switch to **Session primary channel group: Harmony channels**.
3. **AI Referral** appears as its own row.

To make it the default in reports, add the dimension to the report through **Customize report**, then **Save** the change to the current report.

## Check it works

1. In **Admin**, go to **DebugView**, or use **Realtime**.
2. From ChatGPT or Perplexity, click a link to harmonymedspafl.com.
3. In Realtime, add a comparison on **First user source**. The source should be one of the domains above.
4. Within about 24–48 hours, Traffic acquisition shows those sessions under **AI Referral**.

## Notes

- **Missing referrer:** some AI tools open links without sending a referrer. Those visits land in **Direct**, so the AI Referral count is a lower bound.
- **ChatGPT source tag:** ChatGPT often adds `utm_source=chatgpt.com` to links. GA4 then reports the source as `chatgpt.com`, which the rule above matches.
- **Adding more tools:** extend the regex list inside the brackets, separated by `|`, with each dot escaped as `\.`.
