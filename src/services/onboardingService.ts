
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingData {
  id: string;
  user_id: string;
  selected_option: 'manual' | 'concierge';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  current_step: number;
  total_steps: number;
  chat_history: any[];
  completed_assets: string[];
  progress_data: any;
  created_at: string;
  updated_at: string;
}

export interface OnboardingMessage {
  id: string;
  onboarding_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

// Helper function to convert database row to OnboardingData
const convertToOnboardingData = (row: any): OnboardingData => {
  return {
    ...row,
    chat_history: Array.isArray(row.chat_history) ? row.chat_history : [],
    progress_data: row.progress_data || {},
    completed_assets: Array.isArray(row.completed_assets) ? row.completed_assets : []
  };
};

// Helper function to convert database row to OnboardingMessage
const convertToOnboardingMessage = (row: any): OnboardingMessage => {
  return {
    ...row,
    role: row.role as 'user' | 'assistant' | 'system',
    metadata: row.metadata || {}
  };
};

export const createOnboarding = async (
  userId: string,
  selectedOption: 'manual' | 'concierge'
): Promise<OnboardingData | null> => {
  try {
    console.log('📝 Creating onboarding session:', { userId, selectedOption });
    
    // Ensure we have the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('User must be authenticated to create onboarding session');
    }
    
    const { data, error } = await supabase
      .from('user_onboarding')
      .insert({
        user_id: userId,
        selected_option: selectedOption,
        status: 'in_progress',
        current_step: 1,
        total_steps: 5,
        chat_history: [],
        completed_assets: [],
        progress_data: {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating onboarding:', error);
      throw error;
    }

    console.log('✅ Onboarding session created:', data.id);
    return convertToOnboardingData(data);
  } catch (err) {
    console.error('❌ Error in createOnboarding:', err);
    throw err;
  }
};

export const getOnboarding = async (userId: string): Promise<OnboardingData | null> => {
  try {
    console.log('🔍 Getting onboarding for user:', userId);
    
    // Ensure we have the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('User must be authenticated to access onboarding data');
    }
    
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error getting onboarding:', error);
      throw error;
    }

    console.log('✅ Found onboarding:', !!data);
    return data ? convertToOnboardingData(data) : null;
  } catch (err) {
    console.error('❌ Error in getOnboarding:', err);
    throw err;
  }
};

export const updateOnboardingProgress = async (
  onboardingId: string,
  updates: Partial<Pick<OnboardingData, 'current_step' | 'status' | 'completed_assets' | 'progress_data'>>
): Promise<OnboardingData | null> => {
  try {
    console.log('🔄 Updating onboarding progress:', { onboardingId, updates });
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to update onboarding');
    }
    
    const { data, error } = await supabase
      .from('user_onboarding')
      .update(updates)
      .eq('id', onboardingId)
      .eq('user_id', user.id) // Ensure user can only update their own data
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating onboarding:', error);
      throw error;
    }

    console.log('✅ Onboarding updated successfully');
    return convertToOnboardingData(data);
  } catch (err) {
    console.error('❌ Error in updateOnboardingProgress:', err);
    throw err;
  }
};

export const addOnboardingMessage = async (
  onboardingId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): Promise<OnboardingMessage | null> => {
  try {
    console.log('💬 Adding onboarding message:', { onboardingId, role, content: content.substring(0, 50) + '...' });
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to add messages');
    }
    
    // Verify the onboarding session belongs to the authenticated user
    const { data: onboardingData, error: checkError } = await supabase
      .from('user_onboarding')
      .select('user_id')
      .eq('id', onboardingId)
      .single();
    
    if (checkError || !onboardingData || onboardingData.user_id !== user.id) {
      throw new Error('Access denied: onboarding session not found or not owned by user');
    }
    
    const { data, error } = await supabase
      .from('onboarding_messages')
      .insert({
        onboarding_id: onboardingId,
        role,
        content,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }

    console.log('✅ Message added successfully');
    return convertToOnboardingMessage(data);
  } catch (err) {
    console.error('❌ Error in addOnboardingMessage:', err);
    throw err;
  }
};

export const getOnboardingMessages = async (onboardingId: string): Promise<OnboardingMessage[]> => {
  try {
    console.log('📨 Getting messages for onboarding:', onboardingId);
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to view messages');
    }
    
    // The RLS policy will automatically filter messages to only show those
    // belonging to onboarding sessions owned by the authenticated user
    const { data, error } = await supabase
      .from('onboarding_messages')
      .select('*')
      .eq('onboarding_id', onboardingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error getting messages:', error);
      throw error;
    }

    console.log('✅ Found messages:', data?.length || 0);
    return data ? data.map(convertToOnboardingMessage) : [];
  } catch (err) {
    console.error('❌ Error in getOnboardingMessages:', err);
    throw err;
  }
};
