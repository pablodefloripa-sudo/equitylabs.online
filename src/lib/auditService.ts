import { supabase } from '@/integrations/supabase/runtime-client';

/**
 * Audit service for logging user and system actions
 */
export class AuditService {
  /**
   * Log an audit event
   * @param params - The audit log parameters
   */
  static async log(params: {
    userId?: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: params.userId || null,
          action_type: params.actionType,
          entity_type: params.entityType,
          entity_id: params.entityId,
          details: params.details || {},
          ip_address: params.ipAddress,
          user_agent: params.userAgent
        });

      if (error) {
        // We don't want audit logging failures to break the app
        console.warn('Failed to write audit log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in audit service:', error);
      return false;
    }
  }

  /**
   * Log a user action
   */
  static async logUserAction(userId: string, action: string, details?: Record<string, any>) {
    return this.log({
      userId,
      actionType: 'user_action',
      details: { action, ...(details || {}) }
    });
  }

  /**
   * Log an agent action
   */
  static async logAgentAction(userId: string, agentId: string, action: string, details?: Record<string, any>) {
    return this.log({
      userId,
      actionType: 'agent_action',
      entityType: 'agent',
      entityId: agentId,
      details: { action, ...(details || {}) }
    });
  }

  /**
   * Log a system event
   */
  static async logSystemEvent(action: string, details?: Record<string, any>) {
    return this.log({
      actionType: 'system_event',
      details: { action, ...(details || {}) }
    });
  }

  /**
   * Log an authentication event
   */
  static async logAuthEvent(userId: string | null, action: string, details?: Record<string, any>) {
    return this.log({
      userId,
      actionType: 'auth_event',
      details: { action, ...(details || {}) }
    });
  }

  /**
   * Get audit logs for a user (with pagination)
   */
  static async getUserLogs(userId: string, options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    actionType?: string;
  } = {}) {
    const {
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      actionType
    } = options;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get audit statistics for a user
   */
  static async getUserStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action_type, count')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .group('action_type');

    if (error) {
      throw error;
    }

    return data;
  }
}

export default AuditService;