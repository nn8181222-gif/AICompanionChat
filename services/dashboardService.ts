import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface DashboardSection {
  id: string;
  section_key: string;
  section_name: string;
  section_name_ar: string;
  description: string | null;
}

export interface GeneratedContent {
  id: string;
  user_id: string;
  section_id: string;
  title: string;
  content: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Fetch all dashboard sections
export async function fetchDashboardSections() {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dashboard_sections')
    .select('*')
    .order('section_name_ar');
  
  if (error) {
    console.error('Error fetching sections:', error);
    return { data: null, error: error.message };
  }
  
  return { data: data as DashboardSection[], error: null };
}

// Generate content using AI
export async function generateContent(sectionKey: string, customPrompt?: string) {
  const supabase = getSupabaseClient();
  
  console.log('📤 Generating content for section:', sectionKey);
  
  const { data, error } = await supabase.functions.invoke('dashboard-ai', {
    body: {
      sectionKey,
      customPrompt,
    },
  });
  
  if (error) {
    let errorMessage = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const statusCode = error.context?.status ?? 500;
        const textContent = await error.context?.text();
        errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
      } catch {
        errorMessage = `${error.message || 'Failed to generate content'}`;
      }
    }
    console.error('Error generating content:', errorMessage);
    return { data: null, error: errorMessage };
  }
  
  console.log('✅ Content generated');
  return { data: data.content as string, error: null };
}

// Save generated content
export async function saveGeneratedContent(
  sectionId: string,
  title: string,
  content: string,
  metadata?: any
) {
  const supabase = getSupabaseClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { data: null, error: 'User not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('generated_content')
    .insert({
      user_id: userData.user.id,
      section_id: sectionId,
      title,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving content:', error);
    return { data: null, error: error.message };
  }
  
  return { data: data as GeneratedContent, error: null };
}

// Fetch user's saved content for a section
export async function fetchUserContent(sectionId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user content:', error);
    return { data: null, error: error.message };
  }
  
  return { data: data as GeneratedContent[], error: null };
}

// Delete saved content
export async function deleteContent(contentId: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('generated_content')
    .delete()
    .eq('id', contentId);
  
  if (error) {
    console.error('Error deleting content:', error);
    return { error: error.message };
  }
  
  return { error: null };
}
