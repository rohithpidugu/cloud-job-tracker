import React, { useState, useEffect } from 'react';
import { JobService } from './services/storage';


export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    source_site: 'LinkedIn',
    resume_version: '',
    status: 'Applied'
  });

  useEffect(() => {
    JobService.getJobs().then(data => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.target?.value || e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Optimistic UI Update: Show it instantly
    const tempJob = { 
      ...formData, 
      id: 'temp-' + Date.now(), 
      applied_at: new Date().toISOString() 
    };
    setJobs([tempJob, ...jobs]);

    // Save to "Database" (Local Storage for now)
    const savedJob = await JobService.saveJob(formData);
    
    // Replace temp job with real job
    setJobs(current => current.map(j => j.id === tempJob.id ? savedJob : j));
    
    // Reset the fields that change often, keep the ones that don't
    setFormData({ ...formData, company_name: '', role_title: '' });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Application Tracker</h1>
        <p className="text-gray-500 mt-1">Keep track of which resume went where.</p>
      </header>

      <div className="grid md:grid-cols-[350px_1fr] gap-8">
        
        {/* The Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Log New Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input required type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                placeholder="e.g. MI2 Global LLC" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input required type="text" name="role_title" value={formData.role_title} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                placeholder="e.g. Integration Developer" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source / Site</label>
              <select name="source_site" value={formData.source_site} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                <option>LinkedIn</option>
                <option>Company Website</option>
                <option>Indeed</option>
                <option>Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Version Used</label>
              <input required type="text" name="resume_version" value={formData.resume_version} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm" 
                placeholder="e.g. Frontend_v3.pdf" />
            </div>

            <button type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2">
              Save Application
            </button>
          </form>
        </div>

        {/* The Jobs Pipeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Pipeline ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
              No applications tracked yet. Add your first one!
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 leading-tight">{job.role_title}</h3>
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {job.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 font-medium">{job.company_name}</p>
                  
                  <div className="space-y-1.5 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Source:</span> {job.source_site}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-semibold text-gray-700">Resume:</span> 
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{job.resume_version}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Applied: {new Date(job.applied_at).toLocaleDateString()}
                    </p>
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