import { Session, Message, Artifact } from '../../types';

export interface SerializedSessionPayload {
  session: Session;
  messages: Message[];
  artifacts: Artifact[];
  targetGoal: string;
  serializedAt: string;
}

export class SessionSerializer {
  /**
   * Serializes current active session to a portable JSON payload
   */
  static exportSession(
    session: Session,
    messages: Message[],
    artifacts: Artifact[]
  ): SerializedSessionPayload {
    return {
      session,
      messages,
      artifacts,
      targetGoal: session.goalText,
      serializedAt: new Date().toISOString(),
    };
  }

  /**
   * Resumes a serialized payload with a new target model & account
   * without altering the original defined goal.
   */
  static resumeWithNewModel(
    payload: SerializedSessionPayload,
    newModelId: string,
    newAccountId: string
  ): {
    updatedSession: Session;
    messages: Message[];
  } {
    const updatedSession: Session = {
      ...payload.session,
      modelId: newModelId,
      accountId: newAccountId,
      status: 'active',
      goalText: payload.targetGoal, // Ensure target goal is 100% retained!
      lastActiveAt: new Date().toISOString(),
    };

    return {
      updatedSession,
      messages: payload.messages,
    };
  }
}
