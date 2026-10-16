# Firebase Production Setup

This app has no demo login or seeded club records. Firestore is the permanent source of truth; browser storage is only a role-scoped cache populated from authenticated cloud records. The app remains blocked at sign-in until a real Firebase project is configured.

## 1. Create the Firebase project

1. Create a Firebase project owned by the club and add a Web app.
2. Enable Authentication > Email/Password.
3. Create the Firestore database in the club's chosen region.
4. Add the production domain and `localhost` under Authentication > Settings > Authorized domains.
5. Copy the Firebase Web app configuration into the ignored local `.env` using the keys shown in `.env.example`. Set `VITE_FIREBASE_CLUB_ID` to a stable identifier such as `pss-miyapur-gavel`.
6. Restart Vite after editing `.env`.

Firebase Web config values identify the project; Firestore rules, not hiding the web API key, protect records. Never put a Firebase Admin service account key or Gemini API key in `.env` variables prefixed with `VITE_`.

## 2. Deploy database rules and backend functions

Select the Firebase project in Firebase CLI, install the server dependencies, then deploy the checked-in rules and callable functions:

```powershell
npx firebase-tools use --add YOUR_FIREBASE_PROJECT_ID
npm install --prefix functions
npx firebase-tools functions:secrets:set GEMINI_API_KEY --project YOUR_FIREBASE_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,functions --project YOUR_FIREBASE_PROJECT_ID
```

When prompted for `GEMINI_API_KEY`, enter a newly rotated key directly in the terminal. Do not put it in `.env`, source files, or chat. Deployment prompts for `FIRESTORE_BACKUP_BUCKET`; provide the name of a private Cloud Storage bucket owned by this project.

The rules require a signed-in Firebase account and a server-provisioned `/users/{uid}` profile. They restrict reads and writes by role, restrict non-leader support-ticket queries to their own tickets, and make audit records immutable after creation. The Gemini callable independently checks the account profile and builds role-limited context from Firestore.

## 3. Provision club accounts

Create each account in Firebase Authentication. In Firestore, create `/users/{uid}` with the matching Authentication UID and fields:

```json
{
  "name": "Club officer name",
  "role": "President",
  "branch": "Miyapur"
}
```

Allowed roles are `President`, `EC Officer`, `VP Membership`, `VP Public Relations`, and `Member`. Do not let users edit their own role profile. Provision accounts through the Firebase console or a trusted Admin SDK process.

## 4. Start with verified real records

The application intentionally does not upload the previous browser demo fixtures. Sign in with a provisioned President account and enter verified club records into Firestore-backed screens. The client cache is replaced by the signed-in club's Firestore collections; an empty cloud collection stays empty.

The President can download the current device cache from Executive Committee Settings. That file is not a full cloud backup and may contain personal information; store it securely and delete it when no longer needed. Old browser data is never uploaded automatically; an authenticated Firestore snapshot replaces it after successful sign-in.

## 5. Backups and maintenance

The `scheduledFirestoreBackup` function starts a managed Firestore export every day at 03:00 India time. Before deploying it:

1. Create a private Cloud Storage bucket. Do not enable public access.
2. Grant the deployed Functions service account `roles/datastore.importExportAdmin` on the project and `roles/storage.objectAdmin` on the backup bucket.
3. Enable billing and the Cloud Scheduler, Cloud Run, Firestore, and Cloud Storage APIs as required by Firebase Functions deployment.
4. Set a Cloud Storage lifecycle rule that retains exports for the club's chosen period, then deletes older exports.
5. Check function logs for a completed export operation and periodically restore into a separate staging project.

For a manual restore test, use `gcloud firestore import gs://YOUR_BUCKET/firestore-exports/EXPORT_FOLDER` against the staging project. Never test a restore over the live club database.

Audit entries are written alongside app changes and cannot be edited or deleted by client rules. They support routine change history, but are not a compliance-grade immutable audit log because an authorized client initiates them.

## 6. Gemini assistant

The assistant now calls the authenticated `geminiAssistant` Cloud Function. The Gemini key is stored as a Firebase Functions secret and is never sent to the browser. The function reads the user's Firestore profile and builds role-appropriate context server-side. Rotate the key that was previously used in browser configuration before setting the new server secret.
