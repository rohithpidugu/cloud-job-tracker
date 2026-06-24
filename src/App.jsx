import React, { useState, useEffect } from 'react';
import { JobService, AuthService } from './services/storage';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Search and Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const [formData, setFormData] = useState({
    company_name: '', role_title: '', source_site: 'LinkedIn', 
    referrer_name: '', referrer_email: '', resume_version: '', resume_link: '', status: 'Applied'
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
      setFormData({ ...formData, company_name: '', role_title: '', resume_link: '', referrer_name: '', referrer_email: '' }); 
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
    if(!window.confirm("Are you sure you want to delete this application?")) return;
    setJobs(current => current.filter(job => job.id !== id));
    try {
      await JobService.deleteJob(id);
    } catch (error) {
      console.error("Failed to delete job");
    }
  };

  // NEW: Filter and Sort Logic (Happens instantly in the browser)
  const filteredAndSortedJobs = jobs
    .filter(job => {
      const query = searchQuery.toLowerCase();
      return job.company_name.toLowerCase().includes(query) || 
             job.role_title.toLowerCase().includes(query) ||
             job.source_site.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.applied_at) - new Date(a.applied_at);
      if (sortBy === 'date-asc') return new Date(a.applied_at) - new Date(b.applied_at);
      if (sortBy === 'company') return a.company_name.localeCompare(b.company_name);
      if (sortBy === 'role') return a.role_title.localeCompare(b.role_title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  if (!session) return <Auth />;
  if (loading) return <div className="p-8 text-center text-gray-500">Loading pipeline...</div>;

  // Extract the user's name (From Google Auth OR Custom Sign Up)
  const userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      
      {/* Header with Personalized Welcome */}
      <header className="mb-8 border-b pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto hidden sm:block" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Application Tracker</h1>
            <p className="text-gray-600 mt-1 font-medium text-lg">Welcome back, <span className="text-blue-600">{userName}</span>! 👋</p>
          </div>
        </div>
        <button onClick={() => AuthService.signOut()} className="text-sm text-gray-500 hover:text-gray-900 font-medium pb-1 self-start sm:self-auto">
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-8 flex-grow">
        
        {/* Left Column: Input Form */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source / Site</label>
              <select name="source_site" value={formData.source_site} onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                <option>LinkedIn</option>
                <option>Company Website</option>
                <option>Indeed</option>
                <option>Referral</option>
                <option>ZipRecruiter</option>
                <option>Glassdoor</option>
              </select>
              
              {formData.source_site === 'Referral' && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referrer Name</label>
                    <input type="text" name="referrer_name" value={formData.referrer_name} onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referrer Email</label>
                    <input type="email" name="referrer_email" value={formData.referrer_email} onChange={handleInputChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-xs" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
                <input required type="text" name="resume_version" value={formData.resume_version} onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                <input type="url" name="resume_link" value={formData.resume_link} onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg mt-2 transition-colors">
              Save Application
            </button>
          </form>
        </div>

        {/* Right Column: Pipeline Map with Search/Sort */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Pipeline ({filteredAndSortedJobs.length})</h2>
            
            {/* NEW: Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Search roles, companies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="company">Company (A-Z)</option>
                <option value="role">Role (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {filteredAndSortedJobs.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
              {jobs.length === 0 ? "No applications tracked yet. Add your first one!" : "No applications match your search."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAndSortedJobs.map(job => (
                <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative group">
                  
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

      {/* Quick Links & Creator Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center pb-8">
        
        {/* Job Boards */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-gray-600 mb-4">Quick Job Board Links</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://linkedin.com/jobs" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">LinkedIn</a>
            <a href="https://indeed.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">Indeed</a>
            <a href="https://glassdoor.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">Glassdoor</a>
            <a href="https://ziprecruiter.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">ZipRecruiter</a>
            <a href="https://simplyhired.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">SimplyHired</a>
          </div>
        </div>

        {/* Creator Attribution & Tip Jar */}
        <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-100 max-w-sm mx-auto">
          <p className="text-sm text-gray-500">
            Built with 💻 and ❤️ by <span className="font-semibold text-gray-800">Ron</span>
          </p>
          <a 
            href="https://buymeacoffee.com/rohithpidugu" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFDD00] hover:bg-[#FFD000] text-black text-sm font-bold rounded-xl shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </footer>
    </div>
  );
}