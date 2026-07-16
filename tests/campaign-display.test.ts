import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignDateKey,
  formatCampaignDate,
  isCampaignDateToday,
} from "../src/lib/campaigns/campaign-date";
import {
  campaignDeliveryFor,
  displayedNextTouch,
  sentStepsForLead,
} from "../src/lib/campaigns/campaign-display";
import type { MessageLog } from "../src/types/message-log";

const requiredInstant = "2026-07-16T20:00:00.000Z";

test("campaign dates always render in America/New_York", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["Asia/Karachi", "America/New_York", "UTC"]) {
      process.env.TZ = timezone;
      assert.equal(
        formatCampaignDate(requiredInstant),
        "Jul 16, 2026, 4:00 PM EDT",
      );
      assert.equal(campaignDateKey(requiredInstant), "2026-07-16");
    }
  } finally {
    process.env.TZ = originalTimezone;
  }
});

test("Due Today compares New York calendar dates, not elapsed time", () => {
  assert.equal(
    isCampaignDateToday(requiredInstant, "2026-07-16T12:00:00.000Z"),
    true,
  );
  assert.equal(
    isCampaignDateToday(requiredInstant, "2026-07-17T03:59:59.999Z"),
    true,
  );
  assert.equal(
    isCampaignDateToday(requiredInstant, "2026-07-17T04:00:00.000Z"),
    false,
  );
});

test("an unsent Day 1 enrollment keeps Day 1 pending with no sent messages", () => {
  const messages: MessageLog[] = [];

  assert.equal(displayedNextTouch("Day 1 SMS"), "Day 1 SMS");
  assert.deepEqual(sentStepsForLead(messages, "lead-1"), []);
  assert.deepEqual(campaignDeliveryFor(messages, "lead-1"), {
    failed: 0,
    sent: 0,
    lastChannel: undefined,
    lastActivity: null,
    label: "No messages yet",
    color: "#9292A0",
  });
});

test("a confirmed Day 1 message completes only that logged step", () => {
  const message: MessageLog = {
    id: "message-1",
    recipientLeadId: "lead-1",
    recipientLeadName: "Test Lead",
    recipientLeadEmail: "lead@example.com",
    recipientLeadPhone: null,
    recipientLeadStatus: "New",
    isOrphaned: false,
    channel: "SMS",
    sequence: "14-Day Nurture",
    sequenceStep: "Day 1 SMS",
    messageBody: "Hello",
    deliveryStatus: "Sent",
    rawDeliveryStatus: "Sent",
    sentAt: requiredInstant,
    mandrillMessageId: null,
    errorReason: null,
    createdTime: requiredInstant,
  };

  assert.equal(displayedNextTouch("Day 3 Email"), "Day 3 Email");
  assert.deepEqual(sentStepsForLead([message], "lead-1"), ["Day 1 SMS"]);
  assert.equal(campaignDeliveryFor([message], "lead-1").sent, 1);
});
