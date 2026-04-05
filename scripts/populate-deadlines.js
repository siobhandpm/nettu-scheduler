/**
 * populate-deadlines.js — EPW-PRO-247
 * Populates worker calendars with deadlines from the scope spreadsheet.
 * Past events are flagged with overdue: "true" in metadata.
 */

'use strict';

const { NettuClient, config } = require('E:/Projects/EPW/epw-dashboard/node_modules/@nettu/sdk-scheduler');
const fs = require('fs');
const path = require('path');

config.baseUrl = 'http://localhost:5008/api/v1';

const accountsPath = path.join(__dirname, '..', 'epw-worker-accounts.json');
const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));

const NOW = Date.now();

// Helper: date string -> ms timestamp (start of day UTC)
function toTs(dateStr) {
  return new Date(dateStr + 'T00:00:00Z').getTime();
}

// Helper: date string with time -> ms timestamp
function toTsTime(dateStr) {
  return new Date(dateStr).getTime();
}

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

// Build event definitions per worker
const deadlines = [
  // ── Aida (Marketing) ──
  {
    worker: 'aida',
    events: [
      {
        startTs: toTs('2026-06-24'),
        duration: 2 * ONE_DAY,
        busy: true,
        metadata: {
          title: 'Dargan Forum 2026',
          type: 'milestone',
          source: 'EPW-PRO-247',
          notes: 'Main event — 24th and 25th June 2026',
        },
      },
      {
        startTs: toTs('2026-04-07'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'Phased marketing campaign — Dargan Forum',
          type: 'milestone',
          source: 'EPW-PRO-247',
          notes: 'Phased marketing campaign between now and the event date',
        },
        recurrence: {
          freq: 'weekly',
          interval: 2,
          until: toTs('2026-06-23'),
        },
      },
    ],
  },

  // ── Natasha (Events) ──
  {
    worker: 'natasha',
    events: [
      {
        startTs: toTs('2026-06-24'),
        duration: 2 * ONE_DAY,
        busy: true,
        metadata: {
          title: 'Dargan Forum 2026',
          type: 'milestone',
          source: 'EPW-PRO-247',
          notes: 'Main event — 24th and 25th June 2026',
        },
      },
      {
        startTs: toTs('2026-04-14'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'Identify speakers and themes — Dargan Forum',
          type: 'milestone',
          source: 'EPW-PRO-247',
          notes: 'Identification of speakers and themes (intermediary milestone)',
        },
      },
    ],
  },

  // ── Patrick (Sales) ──
  {
    worker: 'patrick',
    events: [
      {
        startTs: toTs('2026-03-01'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'DLR County sponsor identification & outreach',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Over March and April Patrick needs to work with Eoin/Siobhan to identify potential sponsors in DLR County and craft the right approach',
          overdue: toTs('2026-03-01') < NOW ? 'true' : 'false',
        },
        recurrence: {
          freq: 'weekly',
          interval: 1,
          until: toTs('2026-04-30'),
        },
      },
    ],
  },

  // ── Shay (Finance) ──
  {
    worker: 'shay',
    events: [
      {
        startTs: toTs('2026-04-15'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'Dargan Forum — budget preparation',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Finances for the Dargan Forum and budgets',
        },
      },
      {
        startTs: toTs('2026-03-20'),
        duration: ONE_DAY,
        busy: true,
        metadata: {
          title: 'VAT return (Jan/Feb 2026) — due to Revenue',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Jan Feb 2026 VAT return due 20th March to be filed with Revenue Commissioners',
          overdue: toTs('2026-03-20') < NOW ? 'true' : 'false',
        },
      },
      {
        startTs: toTs('2026-04-30'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'CRO annual return dates — Digital HQ t/a Dargan Institute clg #643831',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Identify all CRO dates for Annual Return filings and any other CRO requirements for Digital HQ t/a Dargan Institute clg company number 643831',
        },
      },
      {
        startTs: toTs('2026-04-30'),
        duration: ONE_DAY,
        busy: false,
        metadata: {
          title: 'CRO annual return dates — Digital Tools & Automation #588718',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Identify all CRO dates for Annual Return filings and any other CRO requirements for Digital Tools and Automation company number 588718',
        },
      },
    ],
  },

  // ── Blanaid (Legal) ──
  {
    worker: 'blanaid',
    events: [
      {
        startTs: toTsTime('2026-04-21T10:00:00Z'),
        duration: 2 * ONE_HOUR,
        busy: true,
        metadata: {
          title: 'Circuit Court hearing — Carolan Jr et al',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Court hearing date for the Circuit Court case against Richard Carolan Junior et al on 21st April at 10am',
        },
      },
      {
        startTs: toTs('2026-03-31'),
        duration: ONE_DAY,
        busy: true,
        metadata: {
          title: 'File motion — Costello (R) vs Bednarska (A)',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'File a motion in the case of Eoin Costello (Respondent) vs Anna Bednarska (Applicant) — before the end of March',
          overdue: toTs('2026-03-31') < NOW ? 'true' : 'false',
        },
      },
    ],
  },

  // ── Gary (CTO) ──
  {
    worker: 'gary',
    events: [
      {
        startTs: toTs('2026-03-31'),
        duration: ONE_DAY,
        busy: true,
        metadata: {
          title: 'Security protocols — full responsibility handover',
          type: 'deadline',
          source: 'EPW-PRO-247',
          notes: 'Needs to take clear responsibility for all security protocols as soon as possible to protect our investment — end of March hard deadline',
          overdue: toTs('2026-03-31') < NOW ? 'true' : 'false',
        },
      },
    ],
  },
];

async function populate() {
  let totalCreated = 0;
  let errors = [];

  for (const { worker, events } of deadlines) {
    const acct = accounts[worker];
    if (!acct) {
      errors.push(`No account found for worker: ${worker}`);
      continue;
    }

    const client = NettuClient({ apiKey: acct.apiKey });
    const calendarId = acct.calendarId;
    const userId = acct.userId;

    for (const evt of events) {
      try {
        const payload = {
          calendarId,
          startTs: evt.startTs,
          duration: evt.duration,
          busy: evt.busy,
          metadata: evt.metadata,
        };
        if (evt.recurrence) {
          payload.recurrence = evt.recurrence;
        }
        if (evt.reminders) {
          payload.reminders = evt.reminders;
        }

        const res = await client.events.create(userId, payload);
        if (res.status === 200 || res.status === 201) {
          const eventId = res.data?.event?.id || 'unknown';
          console.log(`[OK] ${worker}: "${evt.metadata.title}" -> ${eventId}`);
          totalCreated++;
        } else {
          const msg = `${worker}: "${evt.metadata.title}" — HTTP ${res.status}`;
          console.error(`[FAIL] ${msg}`);
          errors.push(msg);
        }
      } catch (err) {
        const msg = `${worker}: "${evt.metadata.title}" — ${err.message}`;
        console.error(`[ERROR] ${msg}`);
        errors.push(msg);
      }
    }
  }

  console.log(`\n=== DONE === ${totalCreated} events created, ${errors.length} errors`);
  if (errors.length) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

populate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
