# NINEWORKS WORK DESK — DAILY JOURNAL

## Purpose
Daily, weekly, and monthly reporting should be derived from a single verified work record. The 2026-11-12 change adds an authenticated Daily Journal archive and JSON importer; it does **not** add an unauthenticated public file of private activity.

## Secure data model
- Firestore collection: `dailyJournals`
- Document ID: `YYYY-MM-DD` (Korea date)
- Permission: authenticated accounts only, per `firestore.rules`
- Import format: JSON object with `date`, `entries` array, and optional `summary`, `decisions`, `pending`, `operations`, `reflection`, `tomorrowPriorities`, `meetings`, `meetingNote`.
- An import replaces the daily document for the same date only after confirmation, rather than adding duplicate work logs or tasks.

## How to import a ChatGPT-prepared report
1. Sign in to `https://9workscrm.cloud/`.
2. Open `03 / JOURNAL`.
3. Click `IMPORT JSON` and choose the daily report JSON from ChatGPT.
4. Verify the date, entries, decisions, pending actions and priorities in the daily archive.

## Verification and future automation
- The CRM application is hosted from a **public** GitHub repository. Do not commit the journal's private JSON files to this repository.
- The JSON import writes into authenticated Firebase Firestore. Firestore rules must be deployed to the live project before the first import; the GitHub workflow may skip if Firebase credentials are not configured.
- Creating an automated report in ChatGPT does not itself authenticate to Firebase or write a Firestore document. A future secure server-to-server bridge with authorized credentials is required for unattended saving.
- Imported journal items are notes, not automatically completed tasks. The Work Desk workload graph still uses verified task and work-log data; do not misrepresent chat activity count as time spent or tasks finished.
- Weekly and monthly report views are future work.

## Duplicate prevention
- Daily report: one Firestore document per date.
- Task completion: atomic batch write with deterministic log ID `completed_<todo-id>`.
- Never create a new todo from an unverified or already completed conversation.
