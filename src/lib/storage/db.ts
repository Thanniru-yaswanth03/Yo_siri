/**
 * Yo Siri — Phase 6: IndexedDB Client & Analytics Engine
 * Native, typed browser IndexedDB storage for sessions and challenge records.
 */

import {
  StoredSession,
  ChallengeCompletionRecord,
  ExportDataPayload,
  StorageAnalyticsReport,
  StorageSessionMode,
} from './types';

const DB_NAME = 'yo_siri_db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_CHALLENGES = 'challenge_completions';

// In-memory fallback for environments without IndexedDB (e.g. Node tests, SSR)
let memorySessions: StoredSession[] = [];
let memoryChallenges: ChallengeCompletionRecord[] = [];

/**
 * Open or upgrade the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('mode', 'mode', { unique: false });
        sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CHALLENGES)) {
        const challengeStore = db.createObjectStore(STORE_CHALLENGES, { keyPath: 'id' });
        challengeStore.createIndex('date', 'date', { unique: false });
        challengeStore.createIndex('challengeId', 'challengeId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export class AppStorage {
  /**
   * Save or update a session
   */
  public static async saveSession(session: StoredSession): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const req = store.put(session);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback for tests/SSR
      const idx = memorySessions.findIndex((s) => s.id === session.id);
      if (idx !== -1) {
        memorySessions[idx] = session;
      } else {
        memorySessions.unshift(session);
      }
    }
  }

  /**
   * Get all stored sessions sorted by newest first
   */
  public static async getAllSessions(): Promise<StoredSession[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORE_SESSIONS);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as StoredSession[]) || [];
          // Sort newest first
          list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [...memorySessions].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    }
  }

  /**
   * Get a single session by ID
   */
  public static async getSessionById(id: string): Promise<StoredSession | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS], 'readonly');
        const store = transaction.objectStore(STORE_SESSIONS);
        const req = store.get(id);

        req.onsuccess = () => resolve((req.result as StoredSession) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memorySessions.find((s) => s.id === id) || null;
    }
  }

  /**
   * Delete a session by ID
   */
  public static async deleteSession(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memorySessions = memorySessions.filter((s) => s.id !== id);
    }
  }

  /**
   * Save a daily challenge completion
   */
  public static async saveChallengeCompletion(record: ChallengeCompletionRecord): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_CHALLENGES], 'readwrite');
        const store = transaction.objectStore(STORE_CHALLENGES);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const idx = memoryChallenges.findIndex((c) => c.id === record.id);
      if (idx !== -1) {
        memoryChallenges[idx] = record;
      } else {
        memoryChallenges.push(record);
      }
    }
  }

  /**
   * Get daily challenge completions (optionally filtered by date YYYY-MM-DD)
   */
  public static async getChallengeCompletions(date?: string): Promise<ChallengeCompletionRecord[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_CHALLENGES], 'readonly');
        const store = transaction.objectStore(STORE_CHALLENGES);
        const req = store.getAll();

        req.onsuccess = () => {
          let list = (req.result as ChallengeCompletionRecord[]) || [];
          if (date) {
            list = list.filter((c) => c.date === date);
          }
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (date) {
        return memoryChallenges.filter((c) => c.date === date);
      }
      return [...memoryChallenges];
    }
  }

  /**
   * Clear all application data (IndexedDB and LocalStorage user profile)
   */
  public static async clearAllData(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_SESSIONS, STORE_CHALLENGES], 'readwrite');
        transaction.objectStore(STORE_SESSIONS).clear();
        transaction.objectStore(STORE_CHALLENGES).clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      // ignore
    }

    memorySessions = [];
    memoryChallenges = [];

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('yo-siri-weakness-profile');
        localStorage.removeItem('yo-siri-plan');
        localStorage.removeItem('yo-siri-goal');
      } catch {
        // ignore
      }
    }
  }

  /**
   * Export all user data as a formatted JSON string
   */
  public static async exportUserData(): Promise<string> {
    const sessions = await this.getAllSessions();
    const challengeCompletions = await this.getChallengeCompletions();

    let weaknessProfile: unknown = null;
    let settings: Record<string, unknown> = {};

    if (typeof window !== 'undefined') {
      try {
        const rawWeakness = localStorage.getItem('yo-siri-weakness-profile');
        if (rawWeakness) weaknessProfile = JSON.parse(rawWeakness);

        settings = {
          theme: localStorage.getItem('yo-siri-theme'),
          speakingPace: localStorage.getItem('yo-siri-pace'),
          coachStrictness: localStorage.getItem('yo-siri-strictness'),
          dailyGoalMinutes: localStorage.getItem('yo-siri-goal'),
          dailyPlan: localStorage.getItem('yo-siri-plan'),
        };
      } catch {
        // ignore
      }
    }

    const payload: ExportDataPayload = {
      application: 'Yo Siri User Data Export',
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions,
      challengeCompletions,
      weaknessProfile,
      settings,
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import and validate user data from a JSON string
   */
  public static async importUserData(
    jsonString: string
  ): Promise<{ success: boolean; importedCount: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, importedCount: 0, error: 'Invalid file format: Root must be an object' };
      }

      if (parsed.version !== 1) {
        return { success: false, importedCount: 0, error: 'Unsupported format version: Expected version 1' };
      }

      if (!Array.isArray(parsed.sessions) && !Array.isArray(parsed.challengeCompletions)) {
        return { success: false, importedCount: 0, error: 'Malformed export: Missing sessions or completions list' };
      }

      const sessionsToImport: StoredSession[] = [];

      // Validate sessions array
      if (Array.isArray(parsed.sessions)) {
        for (const item of parsed.sessions) {
          if (item && typeof item === 'object' && item.id && item.mode && item.title) {
            sessionsToImport.push({
              id: String(item.id),
              mode: (item.mode as StorageSessionMode) || 'conversation',
              title: String(item.title),
              startedAt: String(item.startedAt || new Date().toISOString()),
              endedAt: String(item.endedAt || new Date().toISOString()),
              durationSeconds: Number(item.durationSeconds) || 0,
              turnsCount: Number(item.turnsCount) || 0,
              userSpokenSeconds: Number(item.userSpokenSeconds) || 0,
              summary: String(item.summary || 'Imported session'),
              turns: Array.isArray(item.turns) ? item.turns : [],
              metadata: typeof item.metadata === 'object' && item.metadata ? item.metadata : {},
            });
          }
        }
      }

      // Validate challenge completions array
      const challengesToImport: ChallengeCompletionRecord[] = [];
      if (Array.isArray(parsed.challengeCompletions)) {
        for (const item of parsed.challengeCompletions) {
          if (item && typeof item === 'object' && item.id && item.challengeId) {
            challengesToImport.push({
              id: String(item.id),
              challengeId: String(item.challengeId),
              title: String(item.title || 'Challenge'),
              category: String(item.category || 'Daily'),
              date: String(item.date || new Date().toISOString().split('T')[0]),
              plan: item.plan || '15-min',
              durationSeconds: Number(item.durationSeconds) || 60,
              completedAt: String(item.completedAt || new Date().toISOString()),
            });
          }
        }
      }

      if (sessionsToImport.length === 0 && challengesToImport.length === 0) {
        return {
          success: false,
          importedCount: 0,
          error: 'No valid sessions or challenge records found in file',
        };
      }

      // Save valid records
      for (const s of sessionsToImport) {
        await this.saveSession(s);
      }

      for (const c of challengesToImport) {
        await this.saveChallengeCompletion(c);
      }

      // Restore weakness profile and settings if present
      if (typeof window !== 'undefined') {
        try {
          if (parsed.weaknessProfile) {
            localStorage.setItem(
              'yo-siri-weakness-profile',
              JSON.stringify(parsed.weaknessProfile)
            );
          }
          if (parsed.settings && typeof parsed.settings === 'object') {
            for (const [k, v] of Object.entries(parsed.settings)) {
              if (v !== null && v !== undefined) {
                localStorage.setItem(`yo-siri-${k}`, String(v));
              }
            }
          }
        } catch {
          // ignore
        }
      }

      return {
        success: true,
        importedCount: sessionsToImport.length + challengesToImport.length,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Corrupt or unreadable JSON file';
      return { success: false, importedCount: 0, error: msg };
    }
  }

  /**
   * Calculate truthful Progress Report analytics computed directly from stored records
   */
  public static async computeProgressReport(): Promise<StorageAnalyticsReport> {
    const sessions = await this.getAllSessions();

    let totalSpeakingSeconds = 0;
    let interviewQuestionsAnswered = 0;
    let retryImprovementsCount = 0;
    let totalStructureScore = 0;
    let totalRelevanceScore = 0;
    let scoreCount = 0;

    const sessionsByMode: Record<StorageSessionMode, number> = {
      conversation: 0,
      interview: 0,
      'english-lab': 0,
      roleplay: 0,
      challenge: 0,
    };

    const grammarMistakeMap = new Map<string, { count: number; example: string }>();
    const fillerMap = new Map<string, number>();
    const activeDates = new Set<string>();

    for (const session of sessions) {
      totalSpeakingSeconds += session.userSpokenSeconds || 0;
      if (session.mode && sessionsByMode[session.mode] !== undefined) {
        sessionsByMode[session.mode] += 1;
      }

      if (session.startedAt) {
        const dateStr = session.startedAt.split('T')[0];
        activeDates.add(dateStr);
      }

      // Interview questions count
      if (session.mode === 'interview') {
        const qCount = session.turns && session.turns.length > 0 ? session.turns.length : (session.turnsCount || 0);
        interviewQuestionsAnswered += qCount;
      }

      // Check retries
      if (session.metadata?.retryCount && Number(session.metadata.retryCount) > 0) {
        retryImprovementsCount += Number(session.metadata.retryCount);
      }

      // Aggregate turn diagnostics
      if (session.turns && Array.isArray(session.turns)) {
        for (const turn of session.turns) {
          if (turn.grammarMistakes && Array.isArray(turn.grammarMistakes)) {
            for (const m of turn.grammarMistakes) {
              const key = m.explanation ? m.explanation.slice(0, 45) : 'Grammar Precision';
              const curr = grammarMistakeMap.get(key) || { count: 0, example: m.original };
              curr.count += 1;
              grammarMistakeMap.set(key, curr);
            }
          }

          if (turn.fillerWords && Array.isArray(turn.fillerWords)) {
            for (const f of turn.fillerWords) {
              const curr = fillerMap.get(f.word) || 0;
              fillerMap.set(f.word, curr + f.count);
            }
          }

          if (turn.structureScore) {
            totalStructureScore += turn.structureScore;
            scoreCount++;
          }
          if (turn.relevanceScore) {
            totalRelevanceScore += turn.relevanceScore;
          }
        }
      }
    }

    // Calculate practice streak (consecutive calendar days up to today or yesterday)
    let streakDays = 0;
    if (activeDates.size > 0) {
      const today = new Date();
      const checkDate = new Date(today);

      // Check if today or yesterday has a session
      const todayStr = checkDate.toISOString().split('T')[0];
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];

      let startDate: Date | null = null;
      if (activeDates.has(todayStr)) {
        startDate = new Date(today);
      } else if (activeDates.has(yesterdayStr)) {
        startDate = checkDate;
      }

      if (startDate) {
        const runner = new Date(startDate);
        while (activeDates.has(runner.toISOString().split('T')[0])) {
          streakDays++;
          runner.setDate(runner.getDate() - 1);
        }
      }
    }

    // Format speaking time
    const mins = Math.floor(totalSpeakingSeconds / 60);
    const secs = totalSpeakingSeconds % 60;
    const totalSpeakingTimeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Top grammar mistakes sorted by count
    const commonGrammarMistakes = Array.from(grammarMistakeMap.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        example: data.example,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top filler words sorted by count
    const topFillerWords = Array.from(fillerMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recommended next exercises based on weaknesses and gaps
    const recommendedExercises: Array<{
      id: string;
      title: string;
      reason: string;
      mode: StorageSessionMode;
    }> = [];

    if (topFillerWords.length > 0 && topFillerWords[0].count >= 3) {
      recommendedExercises.push({
        id: 'rec-filler',
        title: 'Filler-Word Elimination Practice',
        reason: `Detected ${topFillerWords[0].count} instances of "${topFillerWords[0].word}". Train purposeful 1-second pauses.`,
        mode: 'english-lab',
      });
    }

    if (sessionsByMode.roleplay === 0) {
      recommendedExercises.push({
        id: 'rec-roleplay',
        title: 'Workplace Roleplay: Disagreeing Politely',
        reason: 'Practice expressing technical disagreements diplomatically with peer engineering personas.',
        mode: 'roleplay',
      });
    }

    if (sessionsByMode.interview < 3) {
      recommendedExercises.push({
        id: 'rec-interview',
        title: 'Technical Project Defense Interview',
        reason: 'Master the 4-part architectural explanation: Problem, Approach, Result, Lessons Learned.',
        mode: 'interview',
      });
    }

    if (recommendedExercises.length < 2) {
      recommendedExercises.push({
        id: 'rec-daily',
        title: 'Daily Speaking Challenge: 60-Second Topic Sprint',
        reason: 'Keep your consecutive practice streak alive and maintain vocal cadence.',
        mode: 'challenge',
      });
    }

    if (recommendedExercises.length < 2) {
      recommendedExercises.push({
        id: 'rec-concise',
        title: 'Concise-Answer Word Economy Drill',
        reason: 'Sharpen your answers into high-impact 3-sentence responses.',
        mode: 'challenge',
      });
    }

    return {
      totalSpeakingTimeSeconds: totalSpeakingSeconds,
      totalSpeakingTimeFormatted,
      completedSessionsCount: sessions.length,
      sessionsByMode,
      interviewQuestionsAnswered,
      practiceStreakDays: streakDays,
      commonGrammarMistakes,
      topFillerWords,
      averageStructureScore: scoreCount > 0 ? Math.round(totalStructureScore / scoreCount) : 0,
      averageRelevanceScore: scoreCount > 0 ? Math.round(totalRelevanceScore / scoreCount) : 0,
      retryImprovementsCount,
      recommendedExercises,
    };
  }
}
