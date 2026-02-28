/**
 * Generic undo/redo queue system for reversible actions
 *
 * Supports:
 * - Undo/redo for any action type
 * - Multiple undo levels (default: 50)
 * - Action grouping (batch undo)
 * - TTL for undo actions (default: 5 minutes)
 */

export interface UndoAction<T = any> {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  data: T; // Data needed to undo the action
  undo: (data: T) => Promise<void> | void;
  redo: (data: T) => Promise<void> | void;
}

export class UndoQueue {
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 50, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Push a new action onto the undo stack
   */
  push(action: Omit<UndoAction, 'id' | 'timestamp'>): void {
    const fullAction: UndoAction = {
      ...action,
      id: `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ttl: action.ttl || this.defaultTTL,
    };

    this.undoStack.push(fullAction);

    // Clear redo stack when new action is pushed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    this.cleanExpiredActions();
  }

  /**
   * Undo the last action
   */
  async undo(): Promise<boolean> {
    this.cleanExpiredActions();

    const action = this.undoStack.pop();
    if (!action) {
      return false;
    }

    try {
      await action.undo(action.data);
      this.redoStack.push(action);
      return true;
    } catch (error) {
      console.error('[UndoQueue] Failed to undo action:', error);
      // Put the action back on the stack if undo fails
      this.undoStack.push(action);
      return false;
    }
  }

  /**
   * Redo the last undone action
   */
  async redo(): Promise<boolean> {
    const action = this.redoStack.pop();
    if (!action) {
      return false;
    }

    try {
      await action.redo(action.data);
      this.undoStack.push(action);
      return true;
    } catch (error) {
      console.error('[UndoQueue] Failed to redo action:', error);
      // Put the action back on the redo stack if redo fails
      this.redoStack.push(action);
      return false;
    }
  }

  /**
   * Get the description of the next undo action
   */
  getUndoDescription(): string | null {
    this.cleanExpiredActions();
    const action = this.undoStack[this.undoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Get the description of the next redo action
   */
  getRedoDescription(): string | null {
    const action = this.redoStack[this.redoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    this.cleanExpiredActions();
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all actions
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Remove expired actions from the undo stack
   */
  private cleanExpiredActions(): void {
    const now = Date.now();
    this.undoStack = this.undoStack.filter((action) => {
      const age = now - action.timestamp;
      return age < (action.ttl || this.defaultTTL);
    });
  }

  /**
   * Get the size of the undo stack
   */
  get undoSize(): number {
    this.cleanExpiredActions();
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   */
  get redoSize(): number {
    return this.redoStack.length;
  }
}

// Create a global undo queue instance
export const globalUndoQueue = new UndoQueue();
