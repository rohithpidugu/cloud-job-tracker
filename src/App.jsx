import React, { useState, useEffect } from 'react';
import { JobService, AuthService } from './services/storage';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. Updated Initial State
  const [formData, setFormData] = useState({
    company_name: '', role_title: '', source_site: 'LinkedIn', 
    referrer_name: '', referrer_email: '', // NEW
    resume_version: '', resume_link: '', status: 'Applied'
  });

  useEffect(() => {
    AuthService.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = AuthService.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      JobService.getJobs().then(data => {
        setJobs(data);
        setLoading(false);
      });
    }
  }, [session]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempJob = { ...formData, id: 'temp-' + Date.now(), applied_at: new Date().toISOString() };
    setJobs([tempJob, ...jobs]);
    
    try {
      const savedJob = await JobService.saveJob(formData);
      setJobs(current => current.map(j => j.id === tempJob.id ? savedJob : j));
      // Reset form properly
      setFormData({ 
        ...formData, company_name: '', role_title: '', resume_link: '', 
        referrer_name: '', referrer_email: '' 
      }); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setJobs(current => current.map(job => job.id === id ? { ...job, status: newStatus } : job));
    try {
      await JobService.updateJobStatus(id, newStatus);
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    setJobs(current => current.filter(job => job.id !== id));
    try {
      await JobService.deleteJob(id);
    } catch (error) {
      console.error("Failed to delete job");
    }
  };

  if (!session) return <Auth />;
  if (loading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-8 border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Application Tracker</h1>
          <p className="text-gray-500 mt-1">Keep track of which resume went where.</p>
        </div>
        <button onClick={() => AuthService.signOut()} className="text-sm text-gray-500 hover:text-gray-900 font-medium pb-1">
          Sign Out
        </button>
      </header>

      <div className="grid md:grid-cols-[350px_1fr] gap-8">
        
        {/* Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Log New Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input required type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input required type="text" name="role_title" value={formData.role_title} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            {/* Source Site with Conditional Referral Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source / Site</label>
              <select name="source_site" value={formData.source_site} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                <option>LinkedIn</option>
                <option>Company Website</option>
                <option>Indeed</option>
                <option>Referral</option>
              </select>
              
              {/* 2. Conditional UI for Referral */}
              {formData.source_site === 'Referral' && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in zoom-in duration-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referrer Name</label>
                    <input type="text" name="referrer_name" value={formData.referrer_name} onChange={handleInputChange} 
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referrer Email</label>
                    <input type="email" name="referrer_email" value={formData.referrer_email} onChange={handleInputChange} 
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
                <input required type="text" name="resume_version" value={formData.resume_version} onChange={handleInputChange} 
                  placeholder="e.g. Frontend v3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                <input type="url" name="resume_link" value={formData.resume_link} onChange={handleInputChange} 
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2">
              Save Application
            </button>
          </form>
        </div>

        {/* Pipeline Map */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Pipeline ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
              No applications tracked yet. Add your first one!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
                  
                  <button onClick={() => handleDelete(job.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Job">✕</button>

                  <div className="flex flex-col items-start mb-2 pr-6">
                    <h3 className="font-bold text-gray-900 leading-tight">{job.role_title}</h3>
                    <select 
                      value={job.status} 
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      className={`mt-2 text-xs font-semibold px-2 py-1 rounded-md outline-none cursor-pointer border ${
                        job.status === 'Interviewing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        job.status === 'Offer' ? 'bg-green-50 text-green-700 border-green-200' :
                        job.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer!</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 font-medium">{job.company_name}</p>
                  
                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 flex items-center gap-2"><span className="font-semibold text-gray-700">Source:</span> {job.source_site}</p>
                    
                    {/* 3. Display Referral Info if it exists */}
                    {job.source_site === 'Referral' && (job.referrer_name || job.referrer_email) && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100">
                        <span className="font-semibold text-gray-700">Referred by:</span> {job.referrer_name || 'N/A'} {job.referrer_email ? `(${job.referrer_email})` : ''}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Resume:</span> 
                      {job.resume_link ? (
                        <a href={job.resume_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1">
                          View {job.resume_version} <span className="text-[10px]">↗</span>
                        </a>
                      ) : (
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{job.resume_version}</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">Applied: {new Date(job.applied_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}