import { supabase } from '@/integrations/supabase/runtime-client';

/**
 * Audit service for logging user and system actions.
 */
export class AuditService {
  /**
   * Log a user action.
   * @param userId - The ID of the user performing the action (can be null for system actions).
   * @param actionType - The type of action (e.g., 'USER_LOGIN', 'AGENT_CREATED').
   * @param entityType - The type of entity affected (e.g., 'USER', 'AGENT', 'SUBSCRIPTION').
   * @param entityId - The ID of the entity affected (optional).
   * @param details - Additional details about the action (optional).
   * @param ipAddress - The IP address of the user (optional).
   * @param userAgent - The user agent string (optional).
   */
  static async logAction(
    userId: string | null,
    actionType: string,
    entityType?: string,
    entityId?: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      if (error) {
        console.error('Failed to write audit log:', error);
        // We don't throw here to avoid disrupting the main flow if logging fails.
      }
    } catch (err) {
      console.error('Unexpected error in audit logging:', err);
    }
  }

  /**
   * Log a user login event.
   */
  static async login(userId: string, ipAddress?: string, userAgent?: string) {
    await this.logAction(userId, 'USER_LOGIN', 'USER', userId, {}, ipAddress, userAgent);
  }

  /**
   * Log a user logout event.
   */
  static async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.logAction(userId, 'USER_LOGOUT', 'USER', userId, {}, ipAddress, userAgent);
  }

  /**
   * Log an agent creation.
   */
  static async agentCreated(userId: string, agentId: string, agentName: string, details: Record<string, any> = {}) {
    await this.logAction(userId, 'AGENT_CREATED', 'AGENT', agentId, { agentName, ...details });
  }

  /**
   * Log an agent deletion.
   */
  static async agentDeleted(userId: string, agentId: string, agentName: string) {
    await this.logAction(userId, 'AGENT_DELETED', 'AGENT', agentId, { agentName });
  }

  /**
   * Log a subscription change.
   */
  static async subscriptionUpdated(userId: string, subscriptionId: string, newPlan: string, oldPlan?: string) {
    await this.logAction(userId, 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION', subscriptionId, { newPlan, oldPlan });
  }

  /**
   * Log a system error or runtime error.
   */
  static async systemError(error: Error, context: Record<string, any> = {}) {
    // For system errors, we might not have a user ID. We'll set it to null.
    await this.logAction(null, 'SYSTEM_ERROR', 'SYSTEM', null, { 
      message: error.message, 
      stack: error.stack, 
      ...context 
    });
  }
}

export default AuditService;