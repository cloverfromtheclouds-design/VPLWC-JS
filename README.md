# Summertide Studio — Lyric Contest Judge Scorecards & Automated Rankings

An independent judging portal and live aggregation system built for the **Summertide Studio Producer Panel**. Features automated contest rankings, native multi-sheet Microsoft Excel (`.xlsx`) export, role-based permissions, and **zero-disk cloud persistence powered by Firebase Firestore**.

---

## ☁️ Zero-Disk Cloud Storage (Deploy to Render Free Tier)

Deploying web apps on Render's free tier has an ephemeral disk (files saved locally in `data/` get erased whenever the container restarts or spins down).

This application solves that problem by connecting directly to **Firebase Firestore**:
- **No paid persistent disk needed** on Render ($0 / month).
- All contest songs, judge scorecards, rule flags, and security PINs are automatically stored and synchronized in Google Cloud Firestore in real time.
- The server automatically detects Firebase credentials from Render Environment Variables.

---

## 🚀 How to Deploy to Render (Step-by-Step)

### Step 1: Firebase Configuration
Firebase Firestore is already provisioned and configured for this application. If you prefer to use your own Firebase project:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a free project (Spark Plan).
2. Click **Build > Firestore Database** and click **Create Database** in Production mode.
3. In **Project Settings**, register a Web App (`</>`) to get your configuration keys.

### Step 2: Push Your Code to GitHub
```bash
git add .
git commit -m "Configure Firebase Firestore cloud persistence for Render zero-disk deploy"
git push origin main
```

### Step 3: Create a Web Service on Render
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the build and start settings:
   - **Name**: `summertide-lyric-contest` (or your preferred name)
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 4: Add Environment Variables on Render
In your Render Web Service settings, navigate to the **Environment** tab and add the following Environment Variables (you can also click **"Copy All Render Env Vars"** inside the app's Admin Dashboard under Settings):

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | `supple-hulling-g3kqt` | Your Firebase Project ID |
| `FIREBASE_API_KEY` | `AIzaSyDfKB90nPzHtpFMarJiPKuxsSTpP7A_L4U` | Your Firebase Web API Key |
| `FIREBASE_AUTH_DOMAIN` | `supple-hulling-g3kqt.firebaseapp.com` | Firebase Auth Domain |
| `FIREBASE_FIRESTORE_DATABASE_ID` | `ai-studio-remixremixremixr-04e40b5b-d896-4399-b950-5472ce458c40` | Firestore Database ID (or `(default)`) |
| `FIREBASE_STORAGE_BUCKET` | `supple-hulling-g3kqt.firebasestorage.app` | Firebase Storage Bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | `1038668654986` | Firebase Messaging Sender ID |
| `FIREBASE_APP_ID` | `1:1038668654986:web:a8bb60c29a8dc63e700073` | Firebase Web App ID |
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `3000` | Port for the Express server |

### Step 5: Launch!
Click **Deploy**. Render will install dependencies, build the Vite frontend, start the Node Express server, connect to Firebase Firestore, and launch your live contest scoring service with persistent data and zero disk fees!

---

## 🌟 Key Application Features

- **Automated Ranking Engine**:
  - Eliminates manual spreadsheet calculations and formula errors.
  - Computes weighted criteria averages across all evaluating judges.
  - Automatic tie-breaker rules (Originality & Creativity, Writing Quality, and Evaluator count).
  - Top 3 Podium showcase (Gold 🥇, Silver 🥈, Bronze 🥉) with score ranges and consensus detection.

- **Microsoft Excel (.xlsx) Multi-Sheet Export**:
  - Available exclusively in **Admin Mode**.
  - One-click export generating an Excel workbook with formatted sheets:
    1. **Executive Summary**: Overview of total songs, scorecards, overall averages, and winning entry.
    2. **Final Rankings**: Full standings table with tiers, point averages per criterion, highest/lowest scores, and story briefs.
    3. **All Judge Scorecards**: Raw evaluation logs with timestamps, judge names, individual criteria scores, and feedback comments.
    4. **Contest Song Entries**: Complete roster with titles, artist aliases, Discord handles, and full lyric sheets.

- **Admin-Restricted Entry Uploads & Management**:
  - Only administrators can upload `.txt` participant files or register new songs.
  - Judges access a dedicated blind judging portal (`?role=judge`) to review registered songs and score them without seeing other judges' ratings or rankings.

- **Interactive Judge Scorecard**:
  - 4 core contest criteria scored from **1 to 24** (maximum awardable 96/100, 25 is theoretical ceiling):
    1. **Writing Quality** (Vocabulary, phrasing, spacing, clarity, readability)
    2. **Originality & Creativity** (Distinctive ideas, imagery, wordplay, creative rhymes)
    3. **Emotional Impact & Storytelling** (Emotional resonance, narrative clarity, depth)
    4. **Structure & Cohesion** (Section transitions, progression, consistency, unity)
  - Live progress meter, instant tier badges (*Poor*, *Below Standard*, *Competent*, *Strong*, *Exceptional*), and evaluative summaries.
  - Export scorecard as text file (`.txt`) or print/save as PDF.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Firebase Firestore Web SDK
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Build Tool**: Vite
- **Excel Generation**: SheetJS (`xlsx`)
