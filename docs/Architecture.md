# Genius Academy - Architecture Documentation

## 1. Overview
Genius Academy is a high-velocity "Mastery-as-a-Service" platform. It leverages Generative AI (Google Gemini) to compress complex topics into 10-minute, highly structured "Mastery Sprints." The application is built on the "Genius Engine" protocol, which emphasizes cognitive priming, flow-state design, and active recall.

## 2. Tech Stack
*   **Frontend Framework:** React 19 (TypeScript)
*   **Styling:** Tailwind CSS (Custom "Surgical" Dark Mode Theme)
*   **Icons:** Lucide React
*   **AI Integration:** Google GenAI SDK (`@google/genai`) - Model: `gemini-3-flash-preview`
*   **State Management:** React Context API (`GeniusContext`)
*   **Build Tooling:** Standard ES Modules (via `importmap` for prototype/no-build environments).

## 3. Functional Breakdown

The application functions as a linear state machine based on the **3C Learning Protocol** (Capture, Conceptualize, Consolidate).

### A. Engine Calibration (Onboarding)
*   **Purpose:** Captures user psychographics to tailor AI output.
*   **Features:** Interactive questionnaire determining Learning Style (Visual/Textual), Motivation Trigger, Attention Span, and Complexity Preference.
*   **Storage:** Persisted in `localStorage`.

### B. Ingestion (Dashboard)
*   **Purpose:** The entry point for identifying learning targets.
*   **Features:** 
    *   **Elevation Gauge:** Visualizes user mastery progress.
    *   **Topic Input:** Accepts natural language topics or URLs.
    *   **Depth Toggle:** Switches between "Standard" and "Expert" complexity depths.

### C. Scoping (Concurrent Priming & Analysis)
*   **Purpose:** Pre-activates neural pathways while asynchronously analyzing the topic structure.
*   **User Action:** Answers three-step Socratic input: **Relevance** (Why now?), **Context** (Relates to?), **Expectations** (Scope).
*   **Background Process:** The AI concurrently analyzes the *Topic* + *User Profile* (ignoring priming answers) to identify Potential Goals and Threshold Concepts.
*   **Review Interface:** Users review the AI-suggested goals, toggle their inclusion, and assign priority (Critical, Useful, Interesting).

### D. The Sprint (Session)
*   **Purpose:** High-intensity active learning (The "10-minute Sprint").
*   **Initialization:** Content generation happens *after* the sprint launches, utilizing the specific *Priming Answers* and *Finalized Goals*.
*   **Features:**
    *   **Sprint Timer:** Countdown timer to induce focus urgency.
    *   **Content Rendering:** Markdown rendering of AI-generated learning sections.
    *   **Visual Anchors:** AI-generated imagery keywords (rendered via Pollinations.ai for prototyping).
    *   **Active Reflection:** Interactive prompts requiring user input during reading.
    *   **Threshold Trigger:** A "gate" at the end of content requiring a state change before consolidation.

### E. Zen Pulse (Neural Replay)
*   **Purpose:** Interstitial state for active recovery and synaptic consolidation.
*   **Features:** A suite of cognitive mini-games:
    *   **Countdown:** "No Device Time" visualization.
    *   **Connections:** Free-flow association mapping.
    *   **Word Pairs:** Semantic memory matching game based on the current sprint content.

## 4. Application Flow

The app navigation is controlled entirely by the `LearningPhase` state in `GeniusContext`. There is no traditional router (e.g., React Router).

1.  **Start:** App checks `hasOnboarded`. If `false` -> Show `OnboardingOverlay`.
2.  **Phase: INGESTION:** User is on `Dashboard`. Inputs topic -> `prepareSprint()`.
3.  **Phase: SCOPING:** 
    *   **Parallel Action:** API calls `performInitialScoping` (Topic + Profile).
    *   **User Action:** User fills out Priming inputs.
    *   **Review:** User sees loaded Goals, adjusts priorities.
    *   **Action:** "Initialize Sprint" -> `launchSprint()`.
4.  **Phase: SPRINT:** 
    *   **State:** UI shows "Constructing Neural Pathway" while API calls `generateSprintContent` (Topic + Priming + Goals).
    *   **Status: FOCUS:** Content Loads -> User consumes content.
    *   **Action:** User clicks "Zen Pulse" -> **Status: ZEN_PULSE**.
    *   **Action:** User clicks "End" -> Transition to CONSOLIDATION.
5.  **Phase: CONSOLIDATION:** Review screen.
    *   Action: "Return to Momentum Map" -> Reset to **Phase: INGESTION**.

## 5. Code Module Structure

### `/pages` (View Layer)
*   `Dashboard.tsx`: Main search interface and trajectory visualization.
*   `Scoping.tsx`: The priming questionnaire (left) and Async Analysis Results (right).
*   `Session.tsx`: The core reading interface, including the loading state and sidebar.
*   `Consolidation.tsx`: Post-session summary screen.

### `/components` (UI Library)
*   `OnboardingOverlay.tsx`: Modal for initial user calibration.
*   `ZenPulse.tsx`: The overlay component containing the 3 consolidation mini-games.
*   `SettingsModal.tsx`: Allows re-calibration of user preferences.
*   `ElevationGauge.tsx`: Visual component for gamification (Mastery Score).
*   `SprintTimer.tsx`: Visual component for the session countdown.
*   `DebugConsole.tsx`: Developer tool for monitoring API logs and state.

### `/services` (Data Layer)
*   `geminiService.ts`: 
    *   Handles all interactions with `@google/genai`.
    *   `performInitialScoping`: Phase 2 analysis.
    *   `generateSprintContent`: Phase 3 content creation.
    *   Includes a safety check for `process.env` vs hardcoded keys for prototyping.

### `/store` (State Layer)
*   `GeniusContext.tsx`:
    *   Holds the "Truth" of the application.
    *   Manages `scopingData` (intermediate analysis).
    *   Manages `activeUnit` (the current AI-generated content).
    *   Manages `phase` and `status` (The State Machine).

### `/types.ts` (Domain Models)
*   Defines the shape of the data, most notably `LearningUnit`, `ScopingData`, and `ScopedGoal`.
