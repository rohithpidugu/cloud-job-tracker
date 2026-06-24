import { createClient } from '@supabase/supabase-js';

// Clean the environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseUrl = rawUrl.replace(/['"]/g, '').trim();
const supabaseKey = rawKey.replace(/['"]/g, '').trim();
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;

const supabase = createClient(finalUrl, supabaseKey);

// Data Service
export const JobService = {
  getJobs: async () => {
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
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{
        company_name: jobData.company_name,
        role_title: jobData.role_title,
        source_site: jobData.source_site,
        // NEW: Only save referral info if Referral is selected
        referrer_name: jobData.source_site === 'Referral' ? jobData.referrer_name : null,
        referrer_email: jobData.source_site === 'Referral' ? jobData.referrer_email : null,
        resume_version: jobData.resume_version,
        resume_link: jobData.resume_link || null,
        status: jobData.status
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // NEW: Updates just the status of a specific job
  updateJobStatus: async (id, newStatus) => {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // NEW: Deletes a specific job entirely
  deleteJob: async (id) => {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// Authentication Service
export const AuthService = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  
  // Logs a user in
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // NEW: Registers a new user WITH their name
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: name } // Saves the name to the user profile
      }
    });
    if (error) throw error;
    return data;
  },
  
  // NEW: Triggers the secure Google/GitHub login screen
  signInWithOAuth: async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      // This tells Supabase where to send the user after they log in
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};