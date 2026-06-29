# Deploying Collabora on Google Cloud (Cloud Run + Cloud SQL)

Architecture:

```
 Firebase Hosting (static SPA)  ──HTTPS──▶  Cloud Run (Express API)  ──socket──▶  Cloud SQL (MySQL)
       frontend/dist                              server/                          collabora-db
                                                     │
                                                     └──ADC──▶ Cloud Storage bucket (file uploads)
```

The code is already wired for this:
- `frontend/src/lib/url.ts` reads `VITE_API_BASE_URL` (set at build time).
- `server/index.js` reads `PORT` and `CORS_ORIGINS`.
- `server/db.js` uses the Cloud SQL Unix socket when `INSTANCE_CONNECTION_NAME` is set.
- `server/routes/file-module.js` uses `new Storage()` → Application Default Credentials, so on Cloud Run **no key file is needed**; the service account handles GCS auth.

---

## 0. Prerequisites

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com sqladmin.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com
```

Set some shell vars to reuse below:

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
export DB_INSTANCE=collabora-db
export DB_NAME=collabora
export DB_USER=collabora
export DB_PASS='CHANGE_ME_STRONG'
export BUCKET=collabora-files-$PROJECT_ID
```

---

## 1. Cloud SQL (MySQL)

```bash
# Create the instance (smallest tier; bump for production)
gcloud sql instances create $DB_INSTANCE \
  --database-version=MYSQL_8_0 --tier=db-f1-micro --region=$REGION

# Database + app user
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password="$DB_PASS"

# Grab the connection name (project:region:instance) for later
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE \
  --format='value(connectionName)')
echo $INSTANCE_CONNECTION_NAME
```

### Load the schema  ⚠️ REQUIRED
A fresh database is empty. Two options:

**A) Reconstructed schema (in the repo).** `server/schema.sql` recreates all
tables the code expects (`user, team, user_team, task, sub_task, user_task,
task_comment, discussion, sub_discussion, file, notification,
notification_recipients`). Load it:

```bash
gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME < server/schema.sql
```

This gives a working empty app (no existing data).

**B) Dump from your old database (keeps data + exact types).** If the original
DB is still alive (see `server/.env` for its host), dump and import it instead:

```bash
mysqldump -h OLD_HOST -u OLD_USER -p OLD_DB > collabora.sql
gcloud sql connect $DB_INSTANCE --user=$DB_USER --database=$DB_NAME < collabora.sql
```

---

## 2. Cloud Storage bucket (file uploads)

```bash
gcloud storage buckets create gs://$BUCKET --location=$REGION
```

---

## 3. Service account for the backend

```bash
gcloud iam service-accounts create collabora-api --display-name="Collabora API"
export SA="collabora-api@$PROJECT_ID.iam.gserviceaccount.com"

# Allow it to use Cloud SQL and read/write the bucket
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA" --role="roles/cloudsql.client"
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:$SA" --role="roles/storage.objectAdmin"
```

Store secrets in Secret Manager (recommended over plain env vars):

```bash
gcloud services enable secretmanager.googleapis.com
printf '%s' "$DB_PASS" | gcloud secrets create MYSQL_PASSWORD --data-file=-
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create JWT_SECRET --data-file=-
gcloud secrets add-iam-policy-binding MYSQL_PASSWORD \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
```

---

## 4. Deploy the backend to Cloud Run

From the repo root (`server/Dockerfile` is used automatically):

```bash
gcloud run deploy collabora-api \
  --source ./server \
  --region $REGION \
  --service-account $SA \
  --add-cloudsql-instances $INSTANCE_CONNECTION_NAME \
  --allow-unauthenticated \
  --set-env-vars "INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,MYSQL_USER=$DB_USER,MYSQL_DATABASE=$DB_NAME,GCS_BUCKET_NAME=$BUCKET" \
  --set-secrets "MYSQL_PASSWORD=MYSQL_PASSWORD:latest,JWT_SECRET=JWT_SECRET:latest"

# Capture the URL
export API_URL=$(gcloud run services describe collabora-api --region $REGION \
  --format='value(status.url)')
echo $API_URL
```

(`CORS_ORIGINS` is set in step 6 once the frontend URL is known.)

---

## 5. Deploy the frontend to Vercel

`frontend/vercel.json` already provides the SPA fallback (so React Router deep
links work). Easiest is the Vercel CLI:

```bash
npm install -g vercel
cd frontend
vercel login

# First deploy (links the project). When prompted:
#   - Set up and deploy? yes
#   - Which scope? <your account>
#   - Link to existing project? no  ->  name it e.g. collabora
#   - In which directory is your code? ./   (you are already in frontend)
#   - Vercel auto-detects Vite (build: npm run build, output: dist)
vercel

# Set the backend URL env var (the Cloud Run URL from step 4):
vercel env add VITE_API_BASE_URL production   # paste the $API_URL value

# Build with that env var and ship to production:
vercel --prod
```

Vercel prints a URL like `https://collabora.vercel.app`.

> GUI alternative: push the repo to GitHub, "Import Project" on vercel.com, set
> Root Directory = `frontend`, add env var `VITE_API_BASE_URL`, deploy.

---

## 6. Wire CORS (connect the two)

```bash
gcloud run services update collabora-api --region $REGION \
  --update-env-vars "CORS_ORIGINS=https://collabora.vercel.app,http://localhost:5173"
```

Open the Vercel URL — signup/login should now hit the Cloud Run API, which
talks to Cloud SQL and stores uploads in the bucket.

---

## Redeploy cheat-sheet

```bash
# Backend after code changes:
gcloud run deploy collabora-api --source ./server --region $REGION

# Frontend after code changes:
cd frontend && vercel --prod
```

## Notes
- `npm run build` (frontend) skips type-checking; run `npm run typecheck`
  separately. The repo currently has ~346 pre-existing TS errors to clean up.
- Never commit `server/.env` or `server/gcpbucketkey.json` (already gitignored).
- For local dev, copy `server/.env.example` → `server/.env` and
  `frontend/.env.example` → `frontend/.env`.
