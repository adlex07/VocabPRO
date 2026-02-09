# DeepVocab Tutor — Feature Roadmap

A comprehensive set of features to make DeepVocab the world's most productive vocabulary learning app. Prioritized by impact-to-effort ratio.

---

## **PRIORITY tier 1: Do First** ⭐⭐⭐⭐⭐
*High/Very High impact, Low/Very Low effort. Ship in days.*

---

### 1. Unhide Existing Features & Fix Dead UI

**Status:** Unstarted  
**Effort:** Very Low (2–4 hours)  
**Impact:** High  
**Why Now:** Code already exists. Pure leverage.

#### Problem
Several premium features are already built but completely disconnected or invisible:
- **Focus Overlay** (`FocusOverlay.tsx`) — a Bionic Reading-style focus band (darkens top/bottom, highlights center) — is never mounted in `App.tsx`
- **Visual Learning / Method of Loci** (`VisualLearning.tsx`) — generates mental imagery and spatial memory palace data — exists but `showVisuals` setting has no UI toggle
- **Related Words buttons** in `DeepLearning.tsx` — render as dead `<button>` elements with no `onClick` handlers
- **Settings persistence** — all settings live in React state and reset on page refresh
- **Visual data in Gemini prompts** — the `visual` field is optional in the generative schema and often omitted

#### Feature
1. Mount the `FocusOverlay` component in `App.tsx` with toggle in Settings
2. Add `showVisuals` to the required fields in Gemini prompt; expose toggle in Settings UI
3. Wire up Related Words buttons to trigger word search + add to library
4. Persist all settings (`UserSettings`) to IndexedDB so they survive refresh
5. Expand Settings panel from current 1 toggle (mnemonics) to 4 toggles (mnemonics, visuals, focus overlay, auto-audio placeholder)

#### Why Outsized Impact
- Instant 3x expansion of learning modalities with zero new code needed
- Users who enable visuals + focus overlay + mnemonics get stronger memory encoding
- Dead UI is a credibility killer; fixing it gives impression of a polished product

#### Files to Edit
- `App.tsx` — mount FocusOverlay, wire Settings to component state
- `components/FocusOverlay.tsx` — ensure component props are connected
- `components/VisualLearning.tsx` — ensure this renders correctly
- `components/DeepLearning.tsx` — add `onClick` handlers to Related Words buttons
- `types.ts` — ensure `UserSettings` interface is complete
- `services/storageService.ts` — add `saveSettings()`, `loadSettings()` with IndexedDB persistence
- `index.tsx` (or main settings component) — expand Settings UI with new toggles

---

### 2. Audio/Pronunciation Trainer (Web Speech API)

**Status:** Unstarted  
**Effort:** Low (6–8 hours)  
**Impact:** Very High  
**Why Now:** Infrastructure exists (`autoAudio` setting). Web Speech API is free & browser-native. Auditory encoding is a second memory pathway.

#### Problem
- The `autoAudio` setting exists in `UserSettings` but is completely unimplemented
- Pronunciation is IPA text only — no listening or speaking practice
- Dual Coding Theory (Paivio) proves auditory + visual memory is 2x stronger than visual alone
- Every user is missing an entire sensory channel

#### Feature
1. **TTS Playback** — add speaker icon buttons to every word, definition, and example sentence. Use Web Speech API (`window.speechSynthesis`) or Google Cloud Text-to-Speech
2. **Listen & Type Quiz Mode** — new quiz mode: play audio of word, user types the spelling (trains phonological awareness)
3. **Pronunciation Feedback** (optional Phase 2) — record user's pronunciation via Web Audio API, send to Gemini for AI feedback on accent/stress
4. **Contextual audio** — play example sentences aloud to train listening comprehension in context
5. **Playback speed control** — train at slower speeds, then gradually normal/fast speeds

#### Why Outsized Impact
- Hearing vs. reading activate completely independent memory networks
- Combined effect: **2–3x faster retention & production ability**
- Web Speech API costs $0 and works offline
- "Listen & Type" mode trains the phonological pathway that's completely absent now
- Users can study while commuting/driving (major untapped use case)

#### Implementation Notes
- Use `window.speechSynthesis` for free TTS (no API calls); falls back gracefully if unavailable
- For premium: Google Cloud TTS for higher quality (costs ~$0.004 per word)
- Store user's playback preferences (speed, voice) in Settings
- Add audio playback button as small 🔊 icon next to word

#### Files to Modify
- `index.tsx` (Settings component) — add "Audio Settings" section (speed, voice, auto-play on card open)
- `components/WordDisplay.tsx` — add speaker icon + playback; wire to Web Speech API
- `components/QuickDefinition.tsx` — add audio playback for definition
- `components/QuizSection.tsx` — add new "Listen & Type" quiz mode option
- `quizEngine.ts` — implement `selectQuizMode()` logic to rotate in Listen & Type mode
- `types.ts` — add `audioSettings: { speed: 0.5-2, voice: string, autoPlay?: boolean }` to `UserSettings`

---

## **PRIORITY tier 2: Do Second** ⭐⭐⭐⭐
*High/Very High impact, Low/Medium effort. Ship in 1–2 weeks.*

---

### 3. Smart Study Sessions with Daily Goals & Streaks

**Status:** Unstarted  
**Effort:** Medium (10–15 hours)  
**Impact:** Very High  
**Why Now:** Habit formation is the #1 predictor of long-term retention. Duolingo's $10B valuation is built on streaks.

#### Problem
- Current Library tab shows due words but has zero session structure
- Users must click words one at a time → friction → abandonment
- No daily goal system, no study streak tracker, no session urgency
- No predicted workload visibility

#### Feature
1. **"Start Session" button** — queues all due words into focused sequential flow (no back navigation between words, just prev/next buttons on quiz)
2. **Daily goal system** — user sets target: e.g., "review 15 due words + add 3 new words per day"
3. **Study streak tracker** — calendar heatmap showing days with completed studies; current streak counter
4. **Session summary screen** — after session: accuracy breakdown, time spent, words reviewed, streak progress, XP earned
5. **Daily workload forecast** — "You'll have ~12 reviews due tomorrow, ~8 on Wednesday" (calculated from current FSRS states)
6. **Progress bar toward daily goal** — visible in header during session

#### Why Outsized Impact
- Streaks are the #1 driver of habit formation (behavioral psychology: Fogg Behavior Model)
- Users who maintain streaks study **3–5x longer** before abandoning
- Session structure removes friction: no "what do I do next?" paralysis
- Workload forecasting lets users plan study time strategically
- Visual progress (streak calendar + daily goal progress) is neurologically rewarding

#### Implementation Approach
- Create new component `StudySession.tsx` that handles sequential quiz flow
- Add streak tracking to IndexedDB (`userStreak: { currentStreak, longestStreak, lastStudyDate, calendar: Record<YYYY-MM-DD, bool> }`)
- Add goal settings to `UserSettings` (`dailyGoal: { reviews, newWords }`)
- Add forecasting logic: iterate over all words, count due within next N days
- Session starts with `Start Session` button in `StudyTab.tsx`; replaces Library view with `StudySession.tsx`
- On session end, update streak if user met daily goal

#### Files to Create/Modify
- `components/StudySession.tsx` (NEW) — sequential quiz session flow
- `components/StreakTracker.tsx` (NEW) — calendar heatmap + current streak display
- `types.ts` — add `userStreak`, expand `UserSettings` with `dailyGoal`
- `services/storageService.ts` — add streak persistence & query logic
- `services/fsrsService.ts` — add `forecastDueWords(daysAhead: number)` function
- `components/StudyTab.tsx` — add "Start Session" button, show streak tracker
- `App.tsx` — add streak initialization on mount, persist daily

---

### 4. Learning Analytics Dashboard

**Status:** Unstarted  
**Effort:** Medium (12–16 hours)  
**Impact:** High  
**Why Now:** You've calculated all the data (FSRS states, quiz history); just need to visualize it. What gets measured gets managed.

#### Problem
- Dashboard is a bare data table, not an analytics dashboard
- `logs` table exists in schema but is never written to — no activity tracking
- Users have zero visibility into how their memory is evolving
- FSRS calculates retrievability percentage but it's not graphed
- No learning velocity, no retention rate trends, no predictions

#### Feature
1. **Forgetting curve graph** — per-word retrievability over time; shows memory strengthening with each review (plot FSRS stability/retrievability vs. time)
2. **FSRS state distribution** — pie/bar chart: % of words in New / Learning / Young / Familiar / Mature / Mastered
3. **Quiz accuracy heatmap** — per mode (recognition/context/error/recall): accuracy % over last 7/30 days
4. **Learning velocity chart** — words added per week, words mastered per week, average retention rate
5. **"At Risk" words** — words with retrievability <70% that aren't yet due (need review)
6. **Upcoming workload forecast** — bar chart of reviews due per day over next 14 days
7. **Study time tracking** — total hours per week (capture session start/end times)
8. **Mastery distribution histogram** — how many words at each mastery % level

#### Why Outsized Impact
- Users who *see* their progress learn **2–3x longer** before quitting
- Visualizing memory strengthening is intrinsically motivating
- Identifying at-risk words lets users proactively save them before forgetting
- Learning velocity trends show growth momentum (most powerful habit keeper)

#### Implementation Approach
- Populate `logs` table on every significant action: quiz attempt, word added, session start/end, word deleted
- Create `analytics.ts` service with query functions: `getForgivingCurve()`, `getStateDistribution()`, `getAccuracyByMode()`, etc.
- Create dashboard view component `AnalyticsDashboard.tsx` with chart library (e.g., Chart.js, Recharts)
- Session time tracking: store session start + end timestamps when user starts/ends study session

#### Files to Create/Modify
- `services/db.ts` — ensure `logs` table schema is correct, add indexes
- `services/analyticsService.ts` (NEW) — all query/aggregation logic for charts
- `components/AnalyticsDashboard.tsx` (NEW) — chart components & layout
- `components/dashboard/Dashboard.tsx` — replace current simple dashboard with analytics view (or add tab)
- `services/quizEngine.ts` — log every quiz attempt to `logs` table
- `services/storageService.ts` — log word added/deleted to `logs` table
- `index.tsx` — log session start/end

---

### 5. Settings Persistence & Export/Import

**Status:** Unstarted  
**Effort:** Low (4–6 hours)  
**Impact:** High  
**Why Now:** User data loss is the #1 reason apps fail. Quick win.

#### Problem
- All settings live in React state → lost on page refresh
- No export/import mechanism (Dashboard has placeholder comment but no code)
- No backup strategy; data vulnerable to browser clear-cache accidents
- Cross-device sync is impossible

#### Feature
1. **Persist settings to IndexedDB** — `UserSettings` automatically saved after any change
2. **Export as JSON** — button in Dashboard: "Export My Data" → downloads `deepvocab-backup-2025-02-10.json` with all words + settings
3. **Import from JSON** — upload a backup file to restore all words (merge or replace option)
4. **Auto-recovery dialog** — if browser detects IndexedDB is empty but localStorage has recovery tokens, prompt to restore from last backup

#### Why Outsized Impact
- Data loss anxiety is the #1 reason users abandon after investing time
- A user with 6 months of vocabulary building will pay $5–10 for a reliable backup
- Export/import unlocks future: cloud sync, sharing vocab lists with friends, etc.

#### Implementation Approach
- Add lifecycle hooks to auto-save settings whenever they change
- Create `exportData()` function: serialize all IndexedDB to JSON, trigger download
- Create `importData()` function: parse JSON, validate schema, merge/replace IndexedDB
- Store last-backup timestamp; remind users periodically to back up

#### Files to Modify
- `services/storageService.ts` — add `exportUserData()`, `importUserData()` functions
- `components/dashboard/Dashboard.tsx` — add Export/Import buttons + dialogs
- `App.tsx` — auto-save settings on any change
- `index.tsx` — auto-restore on mount if settings exist in IndexedDB

---

### 6. Confidence-Based Metacognitive Rating

**Status:** Unstarted  
**Effort:** Low (5–7 hours)  
**Impact:** High  
**Why Now:** Single-question addition with profound learning impact. Trains calibration.

#### Problem
- Quiz evaluation is purely mechanical: answer is correct → memory signal
- Users never self-assess confidence → can't calibrate how much they *really* know
- "False confidence" (guessing correctly) gets same memory boost as confident knowledge
- Metacognitive misjudgement is the #1 barrier to efficient studying

#### Feature
1. **Before revealing answer** in quiz modes, ask: "How confident are you?"
   - Radio buttons: 🔴 Guessing | 🟡 Think So | 🟢 Sure
2. **Track calibration** — per user: what % of "Sure" answers are actually correct? (ideal: 90%)
3. **Use confidence in FSRS rating** — e.g.:
   - Correct + Sure → Easy (FSRS rating 4)
   - Correct + Think So → Good (FSRS rating 3)
   - Correct + Guessing → Good (FSRS rating 3)
   - Wrong + Sure → Hard (FSRS rating 2) — worst case, confidence was misplaced
4. **Calibration dashboard** — show confidence distribution + accuracy-by-confidence breakdown
5. **Nudge users when overconfident** — "You've been saying 'Sure' but only getting 70% right on this word — study the definition more carefully"

#### Why Outsized Impact
- Well-calibrated learners study **40% more efficiently** (only study what they don't know)
- Users learn to stop fooling themselves (metacognitive skill transfer)
- Correct + Guessing doesn't mean student knows the word; confidence-adjusted rating fixes this
- No consumer vocab app implements confidence tracking

#### Implementation Approach
- In `QuizSection.tsx`, before answer reveal, show confidence prompt
- Modify `getQuizRating()` in `quizEngine.ts` to take confidence param and adjust rating
- Track confidence + correctness history to calculate calibration metrics
- Add calibration chart to analytics dashboard

#### Files to Modify
- `components/QuizSection.tsx` — add confidence prompt before answer reveal
- `services/quizEngine.ts` — add `confidence` param to `getQuizRating()`, adjust mapping
- `types.ts` — extend `QuizAttempt` to include `confidence: 'guessing' | 'thinking' | 'sure'`
- `services/analyticsService.ts` — add calibration calculation function
- `components/AnalyticsDashboard.tsx` — add calibration chart

---

## **PRIORITY tier 3: Do Third** ⭐⭐⭐
*Very High impact, Medium effort. Ship in 2–4 weeks.*

---

### 7. Collocation Training

**Status:** Unstarted  
**Effort:** Medium (10–12 hours)  
**Impact:** Very High  
**Why Now:** Collocations are how natives sound native. No competitor does this well.

#### Problem
- Knowing a word's definition ≠ knowing how to use it naturally
- "Heavy rain" vs. "strong rain" — dictionaries don't capture these combinations
- No section of your Gemini generation asks for collocations
- Collocation errors are the #1 marker of non-native speech

#### Feature
1. **Collocation generation** — modify Gemini Stage 3 prompt to request:
   - 8–10 common collocations (with frequency: very common / common / less common)
   - Examples: "make a decision", "heavy rain", "strong coffee"
2. **Collocation quiz mode** — new quiz type:
   - shown: "______ rain" → pick from [heavy / strong / hard / intense]
   - or: "make a ______" → pick from [decision / plan / effort / excuse]
3. **Collocation error detection** — in Elaboration feedback, flag collocational errors: "We say 'make a decision' not 'do a decision'"
4. **Collocation clusters** — group related words by shared collocates (e.g., activities that all take "do" vs. "make")
5. **Collocation discovery** — on quiz mistakes, show similar collocations user should learn

#### Why Outsized Impact
- Collocation knowledge separates natives from learners more than vocabulary breadth
- Targeting collocations means user language becomes **immediately more natural-sounding**
- This is PhD-level linguistics pedagogy but practical and implementable

#### Implementation Approach
- Extend Gemini prompt schema to include `collocations: { phrase: string, frequency: 'very_common' | 'common' | 'less_common' }[]`
- Create `CollocQuiz` mode in quiz engine
- Modify Elaboration `evaluateElaboration()` to check for collocation errors
- Add collocations to `DeepLearning` display

#### Files to Modify
- `services/geminiService.ts` — extend Stage 3 output schema with collocations
- `types.ts` — add `collocations` to `DeepLearning` interface
- `services/quizEngine.ts` — add "Collocation" mode selection logic
- `components/QuizSection.tsx` — add UI for collocation quiz mode
- `components/DeepLearning.tsx` — display collocations in Word Network section
- `components/ElaborationSection.tsx` — extend feedback to flag collocation errors

---

### 8. Bulk Word Import with Curation

**Status:** Unstarted  
**Effort:** Medium (10–14 hours)  
**Impact:** Very High  
**Why Now:** Removes friction for power users (exam prep, academic study). No competitor does AI-smart bulk import.

#### Problem
- Words can only be added one at a time through search bar
- Students preparing for GRE/IELTS/TOEFL/academic papers need to process 50–500 words
- Manual entry is a dealbreaker for serious learners

#### Feature
1. **Plain text import** — paste list of words (one per line), auto-add all
2. **CSV import** — upload CSV with word + optional definitions/tags
3. **Smart text extraction** — paste a paragraph; Gemini identifies words above a frequency threshold (e.g., top 5% rarest words) and suggests adding them
4. **Background import queue** — large imports process in background with progressive AI enrichment (doesn't block UI)
5. **Curated word packs** (optional Phase 2) — pre-built lists:
   - Academic Word List (AWL) — 570 words essential for academia
   - GRE Top 500
   - IELTS Essential
   - Business English
6. **Deduplication** — skip words already in user's library
7. **Batch tagging** — all imported words automatically tagged with source ("GRE Prep", "Academic", etc.)

#### Why Outsized Impact
- Exam/academic students represent the highest-value user segment (willing to pay, committed)
- Removes the #1 friction point for power users
- Curated packs make first-time onboarding frictionless ("Just add GRE pack" → instant 500 words)
- Background import queue means user doesn't wait for AI to process 300 words

#### Implementation Approach
- Create import modal component with tabs: Paste Text / CSV Upload / Curated Packs
- Validate + deduplicate against existing library
- Queue imports in IndexedDB as "import job" with status
- Background worker processes jobs: calls Gemini Stage 1→3 for each word
- Track import progress in dashboard

#### Files to Create/Modify
- `components/ImportModal.tsx` (NEW) — import UI (paste/CSV/packs)
- `services/importService.ts` (NEW) — handle parsing, deduplication, queueing
- `services/db.ts` — add `importJobs` table to track batch import progress
- `services/geminiService.ts` — optional: add batch API calls for efficiency
- `components/dashboard/Dashboard.tsx` — add import button, show import progress
- `App.tsx` — background worker to process import queue

---

### 9. Sentence Production Engine with AI Coaching

**Status:** Unstarted  
**Effort:** Medium (12–15 hours)  
**Impact:** Very High  
**Why Now:** Bridges the gap between recognition and production. Most vocab apps don't ask users to produce anything.

#### Problem
- Your Elaboration asks for one user sentence and evaluates it
- Real fluency requires producing in multiple registers, collocations, and contexts
- Receptive mastery (understanding) is 80% of what most apps teach; productive mastery (using) is 20%

#### Feature
1. **Production Challenge** — after word reaches "Familiar" FSRS stage (showing solid understanding), unlock challenge:
   - Write 3 sentences using the word in different contexts: casual conversation, academic writing, professional email
   - Gemini evaluates each for: semantic accuracy, register appropriateness, collocational naturalness, grammar
   - Score 1–5 + detailed feedback per sentence
2. **Story Mode** — user writes short paragraph (3–5 sentences) using 3–5 recent words
   - Gemini evaluates holistic fluency + checks that all words are used correctly
   - Gives encouragement + specific improvement suggestions
3. **Productive Mastery Score** — separate from receptive mastery:
   - Receptive: "Can I understand this word?" (quiz accuracy)
   - Productive: "Can I use this word correctly in writing?" (elaboration score)
   - Both must be 80%+ for word to be considered "mastered"
4. **Gradual scaffolding** — early production attempts get hints/sentence starters
5. **Feedback loop** — if user struggles with production, system recommends extra context/example reviews

#### Why Outsized Impact
- The gap between comprehension and production is the #1 complaint about language learning
- Users who reach productive mastery can *actually use* their vocabulary in real life
- This transforms the app from a study tool to a language-building tool
- Scoring separates "word knowledge" from "word fluency"

#### Implementation Approach
- Add `productiveChallenge` component that renders after word reaches Familiar stage
- Create new Gemini schema for evaluating multi-sentence production
- Track production attempts in word history
- Add separate "productive mastery" score to mastery tracking
- Modify "Mastered" definition to require both receptive AND productive >80%

#### Files to Create/Modify
- `components/ProductionChallenge.tsx` (NEW) — challenge UI (sentence prompts, text input, feedback display)
- `services/geminiService.ts` — add production evaluation schema + prompt
- `services/storageService.ts` — extend word record with productiveHistory[]
- `types.ts` — add `productiveMastery`, `productionAttempt` to WordData
- `components/ReviewSchedule.tsx` — show both receptive + productive mastery scores
- `App.tsx` or analytics — track when users reach productive mastery

---

### 10. Dynamic Context Refreshing

**Status:** Unstarted  
**Effort:** Medium (8–10 hours)  
**Impact:** High  
**Why Now:** Solves the #1 flashcard failure mode: pattern matching instead of true recall.

#### Problem
- Example sentences are generated once and stored staticly
- By the 5th review, users have memorized the specific example, not the word's meaning
- This creates false confidence: "I know the word" (actually: "I memorized this example")
- Classic SRS failure mode documented in learning science literature

#### Feature
1. **Context rotation** — on every Nth quiz (e.g., every 3rd review of a word), Gemini regenerates fresh:
   - Example sentences (3 new ones in different domains: news, fiction, conversation, science, etc.)
   - Quiz distractors (new semantic distractors to keep recognition mode challenging)
   - Context clue pairs for fill-in-the-blank mode
2. **Domain diversity** — track which domains user has already seen (e.g., don't repeat news example twice in a row)
3. **Difficulty scaling** — later contexts use more sophisticated/nuanced meanings of the word to reveal deeper aspects
4. **Metacognitive feedback** — if user struggles with new context: "You might have memorized the example. Reread the actual definition to be sure you understand the concept."

#### Why Outsized Impact
- Users stop pattern matching and develop genuine word understanding
- Each review becomes a test of *true knowledge* not memory of previous context
- This is the difference between "studied the flashcard" and "truly learned the word"

#### Implementation Approach
- Add `contextVersion` counter to word record
- On quiz attempt, check if it's time to refresh contexts (e.g., every 3rd attempt)
- Call Gemini to regenerate contexts for that word
- Store as new record: `examples_v2`, `quiz_v2` alongside original
- Quiz engine randomly selects between versions

#### Files to Modify
- `types.ts` — add `contextVersion`, `examples[]`, `quiz[]` versioning to WordData
- `services/geminiService.ts` — add context regeneration function
- `services/quizEngine.ts` — randomly select between example versions when generating quiz
- `services/storageService.ts` — update word record with new context version on trigger

---

## **PRIORITY tier 4: Do Fourth** ⭐⭐
*Very High/High impact, High effort. Ship in 5–8 weeks.*

---

### 11. Immersive Reading Mode

**Status:** Unstarted  
**Effort:** High (20–30 hours)  
**Impact:** Very High  
**Why Now:** The single highest-yield vocabulary acquisition strategy in linguistics. No competitor does it well.

#### Problem
- Vocabulary learned in isolation transfers poorly to real-world use
- Research shows reading-based acquisition is **3–5x more effective** than flashcard-only learning
- Users study words but never encounter them in authentic extended text
- Every competitor (Anki, Quizlet, Memrise) has this same "flashcard island" problem

#### Feature
1. **Document reader** — user pastes article, essay, book excerpt, or web URL
2. **Smart highlighting** — app highlights:
   - Words in user's library: color-coded by mastery (mastered = green, familiar = yellow, learning = red, new = blue)
   - Unknown words: underlined in gray; one-click to add to library
3. **One-tap addition** — click any word → appears in floating sidebar with definition + "Add" button
4. **Reading stats** — tracks: time spent, words encountered, newly added from reading, review recommended for encountered words
5. **Post-reading micro-quiz** — after reading session, optional 5-word quiz on words encountered in that passage
6. **Contextual review** — if user encounters words they've studied, app suggests reviewing those words (because seeing them in authentic context is a powerful memory signal)
7. **Reading library** — save documents for later re-reading; track which documents you've read and performance on their words

#### Why Outsized Impact
- Reading is the highest-yield vocabulary acquisition modality in existence
- This turns passive reading into active vocabulary mining
- Users naturally encounter words in contexts that make meaning memorable
- Reading sessions generate fresh use cases for production practice (vs. AI examples)

#### Implementation Approach
- Create `ReadingMode.tsx` component with document input
- Use text parser to identify word boundaries
- Check each word against user library for highlighting status
- Store reading history + encountered word list
- Optional: integrate with Readability API or Mercury API for parsing web articles

#### Files to Create/Modify
- `components/ReadingMode.tsx` (NEW) — document input + rendering + highlighting
- `components/ReadingSidebar.tsx` (NEW) — found words + quick add interface
- `services/readingService.ts` (NEW) — word extraction, library lookup, reading history
- `services/db.ts` — add `readings` table for reading history
- `types.ts` — add `Reading`, `ReadingSession` types
- `App.tsx` — route/tab for reading mode

---

### 12. Word Relationship Graph Explorer

**Status:** Unstarted  
**Effort:** High (18–25 hours)  
**Impact:** High  
**Why Now:** Transforms app from word list to semantic network. PhD-level pedagogy made accessible.

#### Problem
- Vocabulary is a *network*, not a list
- Current Related Words buttons in `DeepLearning.tsx` are non-functional (no `onClick` handlers)
- Experts organize vocabulary into clusters by meaning, etymology, collocation
- No visualization of relationships forces learning in isolation

#### Feature
1. **Interactive force-directed graph** — each node = word in user's library; edges = relationships:
   - Synonym (green)
   - Antonym (red)
   - Word family (blue, e.g., happy → happiness → unhappy)
   - Shared etymology (purple)
   - Shared collocate (orange)
2. **Node coloring** — by mastery level (red = learning, yellow = familiar, green = mastered)
3. **Click node** → opens word's study view
4. **Semantic cluster detection** — algorithm highlights groups of related words
5. **"Explore gaps"** — identifies words user *doesn't* know that would bridge between clusters they do (strategic learning recommendation)
6. **Path finding** — "Show me connections between 'happy' and 'miserable'" — visualizes shortest path through known words
7. **Network statistics** — "You've learned 60% of the Academic Word List" or "Your strongest cluster is 'feelings & emotions' (92% mastered)"

#### Why Outsized Impact
- Visualizing semantic relationships shows users vocabulary structure isn't random
- Filling gaps becomes strategic (not just "add random words")
- Reinforces spaced repetition: revisiting related words strengthens entire cluster
- Makes vocabulary building metacognitive + goal-directed

#### Implementation Approach
- Use graph library: D3.js or React-Force-Graph
- Build adjacency list from word relationships (parse synonyms, antonyms, word family, etymology, collocations)
- Implement force-directed layout algorithm (or use library's built-in)
- Cluster detection: community detection algorithm (e.g., Louvain)
- Server/expensive computations: debounce graph updates, cache adjacency list

#### Files to Create/Modify
- `components/WordGraph.tsx` (NEW) — force-directed visualization
- `components/GraphClusterView.tsx` (NEW) — show semantic clusters + stats
- `services/graphService.ts` (NEW) — build adjacency list, cluster detection, path finding
- `components/DeepLearning.tsx` — wire Related Words buttons to graph navigation
- `App.tsx` — new tab/route for graph explorer

---

## Summary Table

| # | Feature | Priority | Impact | Effort | Est. Hours |
|----|---------|----------|--------|--------|-----------|
| 1 | Unhide Existing Features | 1 | High | VLow | 2–4 |
| 2 | Audio/Pronunciation Trainer | 1 | VHigh | Low | 6–8 |
| 3 | Study Sessions + Streaks | 2 | VHigh | Med | 10–15 |
| 4 | Learning Analytics Dashboard | 2 | High | Med | 12–16 |
| 5 | Settings Persistence + Export | 2 | High | Low | 4–6 |
| 6 | Confidence Metacognition | 2 | High | Low | 5–7 |
| 7 | Collocation Training | 3 | VHigh | Med | 10–12 |
| 8 | Bulk Word Import | 3 | VHigh | Med | 10–14 |
| 9 | Production Engine | 3 | VHigh | Med | 12–15 |
| 10 | Dynamic Context Refresh | 3 | High | Med | 8–10 |
| 11 | Immersive Reading Mode | 4 | VHigh | High | 20–30 |
| 12 | Word Relationship Graph | 4 | High | High | 18–25 |

**Total estimated effort to implement all 12 features: 117–172 hours (~3–4 full-time weeks of development)**

---

## Next Steps

1. **Pick one feature from Priority Tier 1** (Feature #1 or #2) and start this week
2. **Create a GitHub issue or Trello card** for tracking progress
3. **Break each feature into sub-tasks** (PR-sized chunks, ~2 hour tasks max)
4. **Update this roadmap** as you complete features (change "Unstarted" → "In Progress" → "Complete")
5. **Ship continuously** — don't wait to combine features; release one at a time so users feel momentum
