# Summertide Studio — Lyric Contest Judge Scorecards & Automated Rankings

An independent judging portal and live aggregation system built for the **Summertide Studio Producer Panel**. Features automated contest rankings, native multi-sheet Microsoft Excel (`.xlsx`) export, and role-based permissions where only administrators may upload or manage song entries.

---

## 🌟 Key Features

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

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Build Tool**: Vite
- **Excel Generation**: SheetJS (`xlsx`)
