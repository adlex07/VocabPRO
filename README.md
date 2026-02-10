<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DeepVocab - AI-Powered Vocabulary Mastery

> Master words, don't just memorize.

DeepVocab is an intelligent vocabulary learning application that uses AI and cognitive science principles to help you truly understand and retain words. Unlike traditional flashcard apps, DeepVocab provides deep etymological analysis, memory techniques, contextual examples, and spaced repetition to ensure words become part of your active vocabulary.

## 🌟 Features

### Core Learning Features
- **AI-Powered Word Analysis**: Three-stage progressive loading with Gemini AI
  - Stage 1: Core essentials (definition, pronunciation, part of speech)
  - Stage 2: Examples and word families
  - Stage 3: Deep learning (etymology, mnemonics, visual associations, analogies)
- **Interactive Text**: Click any word in examples to see quick definitions, double-click for full analysis
- **Multiple Learning Modes**: Recognition, recall, context, and error-spotting quizzes
- **Spaced Repetition System (FSRS)**: Advanced memory scheduling algorithm that optimizes review timing
- **Memory Techniques**:
  - Etymology breakdowns
  - Visual associations and mental imagery
  - Mnemonics and memory stories
  - Arabic associations (for Arabic speakers)
  - Method of Loci support
  - Analogies and comparisons
  
### Study Management
- **Personal Library**: Automatically saves all looked-up words
- **Smart Review System**: Words due for review are highlighted
- **Mastery Tracking**: Progress bars show your retention level (0-100%)
- **Dashboard**: Complete data management with search, filtering, and statistics
- **Adaptive Quizzes**: Difficulty adjusts based on your performance

### User Experience
- **Quick Search Modal**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to search from anywhere
- **Dark Theme**: Eye-friendly interface optimized for long study sessions
- **Mobile Responsive**: Full functionality on phones and tablets
- **Offline-First**: Works offline once words are loaded (uses IndexedDB)
- **No Account Required**: All data stored locally in your browser

## 📋 Prerequisites

- **Node.js** (version 18 LTS or higher recommended)
- **Gemini API Key** from Google AI Studio

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/adlex07/VocabPRO.git
cd VocabPRO
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Key
Create a `.env.local` file in the root directory and add your Gemini API key:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**How to get a Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env.local` file

### 4. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### 5. Build for Production
```bash
npm run build
npm run preview
```

## 📖 How to Use DeepVocab

### Searching for Words
1. **Homepage Search**: On the main screen, type any word in the search box and press Enter or click "Learn"
2. **Quick Search Modal**: Press `⌘K` (or `Ctrl+K`) from anywhere to open the quick search
3. **Interactive Text**: While viewing a word, click any word in examples for a quick definition, or double-click to do a full search

### Understanding Word Display
After searching for a word, you'll see:
- **Word & Pronunciation**: The word with IPA pronunciation guide
- **Definition**: Simple and precise definitions
- **Examples**: Real-world usage examples
- **Word Family**: Related forms (noun, verb, adjective variants)
- **Deep Learning Section** (expands gradually):
  - Etymology with meaning breakdowns
  - Synonyms with nuance explanations
  - Antonyms
  - Comparisons with similar words
  - Memory aids (mnemonics, mental images, analogies)
  - Visual learning cues

### Studying Words
Navigate to the **Library** tab to:
- View all your saved words
- See which words are due for review (highlighted in orange)
- Click any word to practice with quizzes

### Quiz Modes
When studying a word, you'll encounter different quiz types:
- **Recognition**: Choose the correct definition from multiple choices
- **Recall**: Type the definition from memory
- **Context**: Fill in the blank in sentences
- **Error Spotting**: Identify correct/incorrect usage

### Dashboard
The **Dashboard** tab provides:
- Total word count
- Mastery statistics
- Words due for review
- Search and filter functionality
- Individual word management (view, delete)

### Settings
Click the gear icon (⚙️) to toggle:
- **Mnemonics**: Show/hide memory aids
- Additional settings coming soon (audio, visual learning)

## 📊 Data Import/Export

> **Note**: Full import/export functionality is planned for a future update. Currently, all data is stored locally in IndexedDB.

### Current Data Storage
All your vocabulary data is stored in your browser's IndexedDB database under the name `DeepVocabDB`. This includes:
- Word definitions and analysis
- FSRS spaced repetition data
- Quiz performance history
- Mastery levels

### Future Import Format
When import functionality is implemented, the expected JSON format will be:

```json
[
  {
    "word": "ubiquitous",
    "simpleDefinition": "present everywhere",
    "preciseDefinition": "existing or being everywhere at the same time; constantly encountered",
    "pronunciation": "juːˈbɪkwɪtəs",
    "partOfSpeech": "adjective",
    "examples": [
      "Smartphones have become ubiquitous in modern society.",
      "The ubiquitous presence of cameras makes privacy difficult."
    ],
    "wordFamily": ["ubiquity", "ubiquitously"],
    "mastery": 0
  }
]
```

**Minimum Required Fields**:
- `word` (string): The word to learn
- `simpleDefinition` (string): Brief definition
- `preciseDefinition` (string): Detailed definition
- `pronunciation` (string): IPA pronunciation
- `partOfSpeech` (string): e.g., "noun", "verb", "adjective"

**Optional Fields**:
- `examples` (array of strings)
- `wordFamily` (array of strings)
- `mastery` (number, 0-100)
- Additional fields will be auto-generated by AI

### Planned Import Methods
- **JSON Upload**: Upload a JSON file with word list
- **CSV Import**: Import from spreadsheet (word, definition, notes)
- **Plain Text**: Paste a list of words (one per line) for AI enrichment
- **Bulk Processing**: Import large lists with background AI processing

### Manual Backup (Current Method)
To backup your data:
1. Open browser DevTools (F12)
2. Go to Application → IndexedDB → DeepVocabDB → words
3. Export the data manually
4. To restore: Use the same interface to import

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `Ctrl+K` | Open quick search modal |
| `Esc` | Close search modal / quick definition / settings |
| `Enter` | Submit search query |

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling (via inline classes)

### AI & Data
- **Google Gemini AI** - Word analysis and learning content generation
- **Dexie.js** - IndexedDB wrapper for local data storage
- **ts-fsrs** - Free Spaced Repetition Scheduler algorithm

### Key Libraries
- `@google/genai` - Gemini API client
- `dexie-react-hooks` - React hooks for Dexie
- `ts-fsrs` - TypeScript FSRS implementation

## 📁 Project Structure

```
VocabPRO/
├── components/
│   ├── dashboard/
│   │   └── Dashboard.tsx          # Data management interface
│   ├── ArabicAssociations.tsx     # Arabic language learning aid
│   ├── ContextualImageSearch.tsx  # Image learning support
│   ├── DeepLearning.tsx           # Etymology & deep analysis
│   ├── ElaborationSection.tsx     # Elaborative rehearsal
│   ├── FocusOverlay.tsx           # Focus mode overlay
│   ├── Icons.tsx                  # SVG icon components
│   ├── InteractiveText.tsx        # Clickable word interactions
│   ├── QuickDefinition.tsx        # Popup definitions
│   ├── QuizSection.tsx            # Quiz interface
│   ├── ReviewSchedule.tsx         # SRS scheduling display
│   ├── StudyTab.tsx               # Library/study interface
│   ├── VisualLearning.tsx         # Visual memory techniques
│   └── WordDisplay.tsx            # Main word display card
├── services/
│   ├── db.ts                      # Dexie database configuration
│   ├── fsrsService.ts             # FSRS algorithm implementation
│   ├── geminiService.ts           # AI word analysis API
│   ├── migrationService.ts        # Database migrations
│   ├── quizEngine.ts              # Quiz generation logic
│   ├── srsService.ts              # Legacy SRS (SM-2)
│   └── storageService.ts          # Data CRUD operations
├── App.tsx                        # Main application component
├── types.ts                       # TypeScript interfaces
├── index.tsx                      # Application entry point
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

## 🔧 Development Guide

### Running Tests
Currently, no test suite is configured. To add tests, consider:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Code Style
- Uses TypeScript strict mode
- Functional React components with hooks
- Tailwind-style inline classes for styling
- Async/await for all asynchronous operations

### Adding New Features
1. Define TypeScript interfaces in `types.ts`
2. Create database schema changes in `services/db.ts`
3. Implement business logic in appropriate service files
4. Create React components in `components/`
5. Integrate into `App.tsx`

### Environment Variables
All environment variables must be prefixed with `VITE_` to be accessible in the browser:
```env
VITE_GEMINI_API_KEY=your_key_here
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Known Limitations

- No cloud sync (data is local only)
- No audio pronunciation (Web Speech API integration planned)
- No bulk import/export (planned feature)
- Limited offline support for AI features (requires API connection)

## 🗺️ Roadmap

See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for detailed upcoming features including:
- Audio pronunciation training
- Bulk import/export
- Focus mode and visual learning toggles
- Study sessions with daily goals
- Achievement system
- And much more!

## 📄 License

This project is private. All rights reserved.

## 🆘 Troubleshooting

### API Key Issues
**Error**: "API key not found" or "Invalid API key"
- Check that `.env.local` exists in the root directory
- Ensure the variable is named `VITE_GEMINI_API_KEY`
- Restart the dev server after adding the key
- Verify your key is active at [Google AI Studio](https://aistudio.google.com/)

### Data Not Saving
- Check browser console for IndexedDB errors
- Ensure you're not in private/incognito mode
- Clear browser cache and reload
- Check if IndexedDB is enabled in browser settings

### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3000
```

## 📬 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for planned features

---

View your app in AI Studio: https://ai.studio/apps/drive/10pYSYK-xN6A8ZWxvZuMHluThVqZEleub

**Made with ❤️ for serious learners who want to truly master vocabulary, not just memorize it.**
