# Genius Academy Logic Flow & State Machine

This document outlines the operational logic, state transitions, and data propagation through the Genius Academy "Mastery-as-a-Service" platform.

## 1. Core State Machine

The application state is primarily driven by the `LearningPhase` enum stored in `GeniusContext`. There is no client-side routing library (React Router); the `App.tsx` component switches the main view based on the current phase.

| Phase | Component | Description |
| :--- | :--- | :--- |
| **INGESTION** | `Dashboard.tsx` | Entry point. User inputs topic or manages existing programs. |
| **SCOPING** | `Scoping.tsx` | Concurrent user priming and AI analysis of the session topic. |
| **SPRINT** | `Session.tsx` | The active learning session (content consumption). |
| **CONSOLIDATION** | `Consolidation.tsx` | Post-sprint review and integration. |

---

## 2. Detailed Data Flow

### A. Initialization (Dashboard -> Scoping)

When the user enters a topic and clicks "LAUNCH PROGRAM":

1.  **Immediate UI Update (Non-Blocking)**:
    *   `initializeProgram` is called with the raw `topic` string.
    *   A placeholder `LearningProgram` object is created with a generated ID and empty syllabus.
    *   `phase` is set to `SCOPING`.
    *   The UI immediately transitions to the `Scoping` screen.
    *   `isScoping` is set to `true`, triggering loading indicators in the Scoping Right Panel.

2.  **Background Async Process**:
    *   The app triggers `geniusEngine.generateSyllabus(topic)`.
    *   **Goal**: Resolve URLs to real titles (using Google Search grounding) and generate a 7-step syllabus.
    *   **On Completion**:
        *   The placeholder Program in state is updated with the *Real Title* and *Syllabus*.
        *   The global `userState.currentSubject` is updated.
        *   The app triggers `_startScopingForSession` for Session 0 (Foundations).

### B. Priming & Scoping (Parallel Processing)

The `Scoping.tsx` view handles two parallel streams of data:

1.  **Left Panel (User Stream)**:
    *   The user answers 3 priming questions (Relevance, Context, Expectations).
    *   These answers are stored in `currentLog.primingAnswers`.
    *   This process is purely manual and does not require API interaction.

2.  **Right Panel (AI Stream)**:
    *   This panel waits for `_startScopingForSession` to complete.
    *   **Process**: `performInitialScoping` is called with the specific session topic (e.g., "Foundations of [Topic]").
    *   **Output**: A `ScopingData` object containing:
        *   Complexity Rating.
        *   Threshold Concepts (Key jargon).
        *   Suggested Learning Goals.
    *   **UI Update**: Once data arrives, `isScoping` becomes `false`. The "Analysis Ready" indicator appears. The user can then review/edit goals.

### C. Sprint Generation (Scoping -> Sprint)

When the user clicks "INITIALIZE SPRINT":

1.  **Transition**: `phase` becomes `SPRINT`. `status` becomes `FOCUS`.
2.  **Generation**: The app calls `generateSprintContent`.
    *   **Inputs**: 
        *   `topicInput` (The session topic).
        *   `primingAnswers` (The user's context).
        *   `scopingData` (Selected goals and threshold concepts).
        *   `userState.preferences` (Learning style).
    *   **Output**: A `LearningUnit` containing sections, quiz, and Zen Pulse data.
3.  **Loading State**: The `Session` component shows a "Constructing Neural Pathway" loader until the `LearningUnit` is returned.

### D. The Sprint Session

*   **Timer**: A countdown based on `activeUnit.duration` (default 10m).
*   **Content**: Rendered as Markdown.
*   **Zen Pulse**:
    *   User can trigger `status = ZEN_PULSE` manually or via prompt.
    *   This opens the `ZenPulse` overlay (Connections, Pairs, Countdown).
    *   Semantic Mapping (Pairs) uses `activeUnit.wordPairs`.
*   **Completion**: Clicking "End" triggers `completeSprint`.
    *   Logs the sprint to history.
    *   Updates the Program's `currentSessionIndex`.
    *   Updates User Elevation (Gamification).
    *   Sets `phase` to `CONSOLIDATION`.

### E. Consolidation

*   Displays a summary of the session.
*   Offers a return to `INGESTION` (Dashboard).

---

## 3. Resume Flow

When a user resumes an existing program from the Dashboard:

1.  The app identifies the `activeProgram`.
2.  It identifies the `currentSessionIndex`.
3.  It sets `phase` to `SCOPING`.
4.  It immediately calls `_startScopingForSession` with the known topic from the syllabus at that index.
5.  This skips the "Syllabus Generation" step since the program structure already exists.
