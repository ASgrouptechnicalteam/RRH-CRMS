import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';

interface FAQEntry {
  category: string;
  question: string;
  answer: string;
}

// § Phase 8 — written against the actual, current workflows (statuses, exit
// reasons, scoring rules) rather than a generic description, so this stays
// accurate to what the CRM really does today. Update this list whenever a
// workflow it documents changes.
const FAQ_ENTRIES: FAQEntry[] = [
  // Leads
  {
    category: 'Leads',
    question: 'What are the stages a lead moves through?',
    answer:
      'New → Assigned → Contacted → Qualified → (optionally Demo Scheduled → Demo Completed) → Site Visit Scheduled → Site Visit Completed → Negotiation → Booking Initiated → Booked. A lead can be dropped from almost any stage, and a dropped lead can later be recovered back into the pool for reassignment.',
  },
  {
    category: 'Leads',
    question: 'What reasons can I give when dropping a lead?',
    answer:
      'Pick the one that actually matches: No Matching Inventory, Chose Competitor, Budget Mismatch, Not Ready, Do Not Contact, Unresponsive, Invalid Contact, Duplicate Lead, Financing Issue, Location Mismatch, Already Purchased, Just Enquiring, Site Visit No-Show, Negotiation Failed, Out of Service Area, or Other (with your own note). Picking the right reason instead of always choosing "Other" is what makes drop-reason reporting useful for the team.',
  },
  {
    category: 'Leads',
    question: 'Can a customer have more than one preferred location?',
    answer:
      "Yes — Preferred Location accepts a list, not just one. A lead matches a Project Manager's territory if ANY of the listed locations falls in that PM's area, not only the first one entered.",
  },
  {
    category: 'Leads',
    question: 'What happens to a dropped lead?',
    answer:
      'It moves to Dropped with the reason you gave attached to its history. An MD or Sales Manager can recover it back into the pool (status Recovered to Pool), after which it re-enters as Assigned to whoever picks it up next.',
  },

  // Site Visits
  {
    category: 'Site Visits',
    question: 'What happens right after I mark a site visit as Completed?',
    answer:
      'Two things happen automatically: the lead moves toward Negotiation (or Dropped, if every linked property was marked Not Interested), and the telecaller originally on the lead gets a notification containing a ready-made WhatsApp message with a short feedback-form link — they just tap it and hit send to the customer.',
  },
  {
    category: 'Site Visits',
    question: 'Does the customer need to log in to leave feedback?',
    answer:
      'No. The feedback link is unique to that one visit and works with no account — a star rating, three quick yes/no questions, and an optional comment, done in under a minute. The link stops working 14 days after the visit, and it only accepts one submission.',
  },
  {
    category: 'Site Visits',
    question: 'Who can see customer feedback once it comes in?',
    answer:
      "The rated PM/agent's own reporting manager, and all MDs, both get a notification the moment it's submitted. Anyone with team-visibility access can also see the full history on the Customer Feedback page — MDs see the whole company, managers see their own direct reports.",
  },

  // Properties
  {
    category: 'Properties',
    question: 'What is the property verification chain?',
    answer:
      'Pending Verification (PM checks it) → Pending DM Polish (DM tidies details, or verifies it as-is unchanged) → Pending MD Approval (MD signs off) → Live. If the MD rejects it at any point, it goes to Rejected, and the PM can Resubmit to send it back through verification.',
  },
  {
    category: 'Properties',
    question: 'A property is "Live" — why isn\'t it showing on our public website?',
    answer:
      "Live only means it has cleared internal approval. Making it visible on Sonthillu or Radha is a separate step — the Publish toggle on the property's page. A property can be fully approved and still sit unpublished until someone flips that toggle.",
  },
  {
    category: 'Properties',
    question: "Where does a property's price actually come from?",
    answer:
      "From the pricing engine's computed Final Price — base rate plus any charge categories (facing, floor, corner, etc.) and tax — not a manually typed number. This is the same pricing engine used for Project Units, so a standalone Property is priced the same rigorous way a project unit is.",
  },

  // Performance & Attendance
  {
    category: 'Performance & Attendance',
    question: 'How does check-in time affect my performance score?',
    answer:
      'Scanning in before 10:00 AM earns +1.0. Between 10:00–10:15 AM earns +0.5. Between 10:15–10:30 AM earns +0. After 10:30 AM, the normal Late-arrival penalty applies as before. An approved late arrival or an approved leave never changes your score either way — no gain, no loss.',
  },
  {
    category: 'Performance & Attendance',
    question: "Does my CRM session log me out if I'm away for a while?",
    answer:
      "No — once you're logged in, your session stays active until you log out yourself, or someone with admin access revokes it (for example, after a password change or on your last working day). If you've turned on App Lock in Settings, being idle for 30 minutes shows a lock screen requiring your device's fingerprint/Face/PIN to continue — the login itself doesn't end, it just needs to be unlocked.",
  },
  {
    category: 'Performance & Attendance',
    question: "What is App Lock, and why don't I see the option?",
    answer:
      "It's an optional extra layer of protection for a CRM session that never expires — after 30 minutes idle, it asks for your device's fingerprint, Face ID, or PIN before showing CRM data again. It only appears in Settings if your device actually has one of those set up (Windows Hello, Touch ID, or similar); a device with none configured simply won't show the option, and that's expected, not a bug.",
  },

  // Kiosk
  {
    category: 'Kiosk',
    question: 'What is the attendance Kiosk, and can I install it separately?',
    answer:
      'The Kiosk is the QR-scan attendance terminal at /kiosk — meant to run on a shared device at the office entrance, not a personal login. Opening /kiosk on a device and using "Install" adds its own home-screen icon, separate from the main CRM app icon, that opens straight into kiosk mode.',
  },
  {
    category: 'Kiosk',
    question: 'Is a kiosk device a security risk if it stays logged in?',
    answer:
      "Its login is scoped only to scanning attendance QR codes — it carries no employee identity or permission to view leads, customers, or financial data, so the worst case of it staying logged in is attendance-record mischief, not a data leak. If a kiosk device is ever lost, an MD can revoke just that device's credential from Kiosk Management without affecting any other kiosk.",
  },

  // General
  {
    category: 'General',
    question:
      "I found something that looks broken or a status that doesn't make sense — what do I do?",
    answer:
      'Note the exact screen, the lead/property/booking code if there is one, and what you expected to happen, then raise it with your manager or MD. Screenshots help a lot.',
  },
];

const CATEGORY_ORDER = [
  'Leads',
  'Site Visits',
  'Properties',
  'Performance & Attendance',
  'Kiosk',
  'General',
];

export const FAQPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ENTRIES;
    return FAQ_ENTRIES.filter(
      (e) =>
        e.question.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FAQEntry[]>();
    for (const entry of filtered) {
      if (!map.has(entry.category)) map.set(entry.category, []);
      map.get(entry.category)!.push(entry);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      entries: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Help & FAQ</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Answers to how the CRM's workflows actually behave.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
        />
      </div>

      {grouped.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
          <HelpCircle className="w-8 h-8" />
          <p className="text-sm">No matching questions — try a different search.</p>
        </div>
      )}

      {grouped.map(({ category, entries }) => (
        <section key={category} className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 px-1">
            {category}
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
            {entries.map((entry) => {
              const key = `${category}::${entry.question}`;
              const isOpen = openIndex === key;
              return (
                <div key={key}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {entry.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {entry.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
