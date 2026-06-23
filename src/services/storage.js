import { createClient } from '@supabase/supabase-js';

// Grab the raw variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Forcefully clean them of any hidden spaces, newlines, or accidental quotes
const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
const supabaseKey = rawKey.replace(/['"]/g, '').trim();

// Double-check the URL has https://
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;

const supabase = createClient(finalUrl, supabaseKey);

export const JobService = {
  getJobs: async () => {
    // Fetch all records, sorted by newest first
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return [];
    }
    return data;
  },

  saveJob: async (jobData) => {
    // Insert the new job and ask Supabase to return the saved record instantly
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{
        company_name: jobData.company_name,
        role_title: jobData.role_title,
        source_site: jobData.source_site,
        resume_version: jobData.resume_version,
        status: jobData.status
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving job:", error);
      throw error;
    }
    return data;
  }
};