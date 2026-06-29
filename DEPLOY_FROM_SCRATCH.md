# Collabora — Deploy From Scratch

Bringing the app back to life on a **brand-new GCP project**.

**Architecture**
```
 Vercel (React/Vite UI)  ──HTTPS──▶  Cloud Run (Express API)  ──socket──▶  Cloud SQL (MySQL)
                                            │
                                            └──auto auth──▶  Cloud Storage bucket (file uploads)
```

The code is already wired for this — no source edits required:
- `frontend/src/lib/url.ts` reads `VITE_API_BASE_URL` (set at build time on Vercel).
- `frontend/vercel.json` provides the SPA fallback for React Router.
- `server/index.js` reads `PORT` and `CORS_ORIGINS`.
- `server/db.js` connects via the Cloud SQL Unix socket when `INSTANCE_CONNECTION_NAME` is set.
- `server/routes/file-module.js` uses `new Storage()` → on Cloud Run the service
  account authenticates to GCS automatically (**no `gcpbucketkey.json` needed**).
- `server/schema.sql` recreates all 12 tables for the fresh database.

> You start with an **empty database** (old data is gone). After deploy, just
> sign up a new account.

---

## 0. Install the tools

```bash
# macOS
brew install --cask google-cloud-sdk
npm install -g vercel

# Verify
gcloud version
vercel --version
```

---

## 1. Create a NEW GCP project + attach billing

```bash
# Log in with the Google account you want to own this project
gcloud auth login

# Create a brand-new project (id must be globally unique, lowercase, 6-30 chars)
export PROJECT_ID=collabora-prod-$RANDOM
gcloud projects create $PROJECT_ID --name="Collabora"
gcloud config set project $PROJECT_ID
```

**Attach billing (required before any resource can be created):**
1. Open https://console.cloud.google.com/billing
2. Create or pick a billing account (the free trial credit works).
3. Link it to `$PROJECT_ID` (Billing → Account management → link project).

Confirm it's linked:
```bash
gcloud billing projects describe $PROJECT_ID
# billingEnabled: true
```

---

## 2. Enable the required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com
```

---

## 3. Set reusable variables

Keep this terminal open; these vars are used throughout.

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export DB_INSTANCE=collabora-db
export DB_NAME=collabora
export DB_USER=collabora
export DB_PASS='CHANGE_ME_TO_A_STRONG_PASSWORD'
export BUCKET=collabora-files-$PROJECT_ID
```

---

## 4. Create Cloud SQL (MySQL) and load the schema

```bash
# Create the instance (smallest tier; bump later for real load)
gcloud sql instances create $DB_INSTANCE \
  --database-version=MYSQL_8_0 --tier=db-f1-micro --region=$REGION

# Database + application user
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password="$DB_PASS"

# Save the connection name (project:region:instance) for Cloud Run
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE \
  --format='value(connectionName)')
echo "INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME"

# Allow your current machine to load the schema, then import it
gcloud sql instances patch $DB_INSTANCE \
  --authorized-networks="$(curl -s ifconfig.me)/32" --quiet
gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME < server/schema.sql
```

Verify the tables exist:
```bash
gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME \
  --quiet <<< "SHOW TABLES;"
# expect: user, team, user_team, task, sub_task, user_task, task_comment,
#         discussion, sub_discussion, file, notification, notification_recipients
```

---

## 5. Create the storage bucket + service account

```bash
# Bucket for uploaded files
gcloud storage buckets create gs://$BUCKET --location=$REGION

# Dedicated service account the backend runs as
gcloud iam service-accounts create collabora-api --display-name="Collabora API"
export SA="collabora-api@$PROJECT_ID.iam.gserviceaccount.com"

# Let it reach Cloud SQL and read/write the bucket
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" --role="roles/cloudsql.client"
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:$SA" --role="roles/storage.objectAdmin"
```

---

## 6. Store secrets in Secret Manager

```bash
printf '%s' "$DB_PASS" | gcloud secrets create MYSQL_PASSWORD --data-file=-
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create JWT_SECRET --data-file=-

for S in MYSQL_PASSWORD JWT_SECRET; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done
```

---

## 7. Deploy the backend to Cloud Run

Run from the **repo root** (uses `server/Dockerfile`):

```bash
gcloud run deploy collabora-api \
  --source ./server \
  --region $REGION \
  --service-account $SA \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --allow-unauthenticated \
  --set-env-vars "INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,MYSQL_USER=$DB_USER,MYSQL_DATABASE=$DB_NAME,GCS_BUCKET_NAME=$BUCKET" \
  --set-secrets "MYSQL_PASSWORD=MYSQL_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest"

# Grab the public URL
export API_URL=$(gcloud run services describe collabora-api --region $REGION \
  --format='value(status.url)')
echo "Backend is live at: $API_URL"
```

Smoke-test it (a 401 here is GOOD — it means the API and DB are working):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"x"}'
# 401 = reached the DB and rejected bad creds.  500 = DB/connection problem.
```

---

## 8. Deploy the UI to Vercel

```bash
cd frontend
vercel login          # if not already

# First deploy — links/creates the Vercel project.
# Accept the Vite auto-detection (build: npm run build, output: dist).
vercel

# Point the UI at the backend, then ship to production:
vercel env add VITE_API_BASE_URL production    # paste the $API_URL from step 7
vercel --prod
```

Vercel prints your live URL, e.g. `https://collabora.vercel.app`.
Note it down as `FRONTEND_URL`.

---

## 9. Connect the two (CORS)

```bash
cd ..   # back to repo root (so $REGION etc. are still set)
gcloud run services update collabora-api --region $REGION \
  --update-env-vars "CORS_ORIGINS=https://collabora.vercel.app,http://localhost:5173"
```
Replace `https://collabora.vercel.app` with your actual `FRONTEND_URL`.

---

## 10. Go live ✅

Open your Vercel URL → **Sign up** → create a team → it flows through:
Vercel UI → Cloud Run API → Cloud SQL + GCS.

---

## Redeploy later

```bash
# Backend (after code changes):
gcloud run deploy collabora-api --source ./server --region $REGION

# Frontend (after code changes):
cd frontend && vercel --prod
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `curl` to API returns **500** | DB not reachable. Check `--add-cloudsql-instances` and `INSTANCE_CONNECTION_NAME` match, and `MYSQL_PASSWORD` secret is correct. |
| Login works but **CORS error** in browser | `CORS_ORIGINS` doesn't match the exact Vercel URL (step 9). Include `https://` and no trailing slash. |
| File upload fails | Bucket name (`GCS_BUCKET_NAME`) wrong, or SA missing `storage.objectAdmin` (step 5). |
| `gcloud sql connect` times out | Re-run the `--authorized-networks` patch in step 4 (your IP may have changed). |
| Frontend deep links 404 on refresh | `frontend/vercel.json` (SPA rewrite) must be present — it is in the repo. |

## Cost note
`db-f1-micro` Cloud SQL + Cloud Run + a small bucket sit comfortably in free-tier
/ trial credit for a demo. Cloud SQL is the main always-on cost — **stop the
instance** when not in use: `gcloud sql instances patch $DB_INSTANCE --activation-policy=NEVER`.
