export type ScopingGoal = {
  id: string;
  text: string;
  isSelected: boolean;
  priority: 'Useful' | 'Critical' | 'Interesting';
};

export interface ScopingPayload {
  topic: string;
  prefs: {
    learningStyle: string;
    motivationTrigger: string;
    attentionSpan: string;
    complexityPreference: string;
  };
  sessionIndex: number;
  totalSessions: number;
  programTopic: string;
}

export interface SprintPayload {
  topic: string;
  priming: {
    relevance: string;
    relation: string;
    scope: string;
  };
  scopingData: {
    complexity: string;
    thresholdConcepts: string[];
    goals: ScopingGoal[];
  };
  prefs: ScopingPayload['prefs'];
}
