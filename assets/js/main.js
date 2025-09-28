// --- Small UX helpers ---
(function() {
    // In-view reveal animations
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} });
    },{threshold:.16});
    document.querySelectorAll('[data-reveal]').forEach(el=>obs.observe(el));
  
    // Year in footer
    const y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
  })();
  
  // --- Dynamic GitHub Portfolio ---
  (function(){
    const GH_USER = 'Kaushik0621';
    const API_URL = `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`;
    const CACHE_KEY = 'gh_repos_cache_v3';
    // Pin any repos here by name to force-feature them:
    const FEATURED_OVERRIDE = [
      // 'aisearchtool', 'voice_agent', 'MCP_based_conversation'
    ];
  
    const els = {
      search: document.getElementById('proj-search'),
      sort: document.getElementById('proj-sort'),
      hideArchived: document.getElementById('hide-archived'),
      chips: document.getElementById('proj-filter-chips'),
      featured: document.getElementById('proj-featured'),
      grid: document.getElementById('proj-grid'),
      empty: document.getElementById('proj-empty')
    };
  
    if (!els.grid) return; // no projects section on this page
  
    let repos = [], filtered = [], activeFilters = new Set();
  
    function cacheGet(){
      try{
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const {ts, data} = JSON.parse(raw);
        if (Date.now() - ts < 12*60*60*1000) return data; // 12h
      }catch(e){}
      return null;
    }
    function cacheSet(data){
      try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts:Date.now(), data})) }catch(e){}
    }
  
    async function fetchReposLive(){
      const res = await fetch(API_URL, {
        headers: { 'Accept':'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }
      });
      if(!res.ok) throw new Error('GitHub API error: '+res.status);
      return res.json();
    }
    async function fetchReposFallback(){
      const res = await fetch('data/projects.json', {cache: 'no-store'});
      if (!res.ok) throw new Error('fallback missing');
      return res.json();
    }
  
    function humanDate(s){
      try { return new Date(s).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'}) }
      catch { return s }
    }
  
    function buildCard(r){
      const col = document.createElement('div'); col.className='col-4';
      const card = document.createElement('div'); card.className='card item proj-card';
      const title = document.createElement('h3'); title.textContent = r.name;
      const meta = document.createElement('div'); meta.className='meta';
      meta.textContent = `${r.language || '—'} • ★${r.stargazers_count || 0} • Updated ${humanDate(r.updated_at || r.pushed_at || r.created_at)}`;
      const desc = document.createElement('p'); desc.textContent = r.description || '';
  
      const badges = document.createElement('div'); badges.className='repo-badges';
      (r.topics||[]).slice(0,8).forEach(t=>{
        const b=document.createElement('span'); b.className='badge'; b.textContent=t; badges.appendChild(b);
      });
  
      const btns = document.createElement('div'); btns.className='btnrow';
      const gh = document.createElement('a'); gh.className='btn'; gh.href=r.html_url; gh.target='_blank'; gh.rel='noopener'; gh.textContent='GitHub';
      btns.appendChild(gh);
      if (r.homepage) {
        const demo = document.createElement('a'); demo.className='btn'; demo.href=r.homepage; demo.target='_blank'; demo.rel='noopener'; demo.textContent='Live Demo'; btns.appendChild(demo);
      }
  
      card.appendChild(title); card.appendChild(meta);
      if (desc.textContent) card.appendChild(desc);
      card.appendChild(badges); card.appendChild(btns);
      col.appendChild(card);
      return col;
    }
  
    function deriveChips(data){
      const counts = new Map();
      data.forEach(r=>{
        if(r.language){ counts.set(r.language, (counts.get(r.language)||0)+1); }
        (r.topics||[]).forEach(t=> counts.set(t, (counts.get(t)||0)+1));
      });
      return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([k])=>k);
    }
  
    function renderChips(list){
      els.chips.innerHTML='';
      list.forEach(name=>{
        const chip = document.createElement('span'); chip.className='tag chip-filter'; chip.textContent=name;
        chip.addEventListener('click', ()=>{
          if(activeFilters.has(name)) activeFilters.delete(name); else activeFilters.add(name);
          chip.classList.toggle('active');
          applyFilters();
        });
        els.chips.appendChild(chip);
      });
    }
  
    function applyFilters(){
      const q = (els.search.value||'').toLowerCase().trim();
      const hideArch = els.hideArchived.checked;
      filtered = repos.filter(r=>{
        if(hideArch && r.archived) return false;
        const hay = [r.name, r.description||'', (r.language||'')].concat(r.topics||[]).join(' ').toLowerCase();
        if(q && !hay.includes(q)) return false;
        if(activeFilters.size){
          const tagset = new Set([r.language||'', ...(r.topics||[])]);
          for(const f of activeFilters){ if(!tagset.has(f)) return false; }
        }
        return true;
      });
      sortAndRender();
    }
  
    function sortAndRender(){
      const mode = els.sort.value;
      const arr = [...filtered];
      if(mode==='updated'){ arr.sort((a,b)=> new Date(b.updated_at||0)-new Date(a.updated_at||0)); }
      else if(mode==='stars'){ arr.sort((a,b)=> (b.stargazers_count||0)-(a.stargazers_count||0)); }
      else if(mode==='name'){ arr.sort((a,b)=> a.name.localeCompare(b.name)); }
  
      const featuredNames = FEATURED_OVERRIDE.length ? new Set(FEATURED_OVERRIDE) : null;
      const featured = arr.filter(r => featuredNames ? featuredNames.has(r.name) : (r.homepage || (r.stargazers_count||0) >= 3)).slice(0,6);
      const rest = arr.filter(r => !featured.includes(r));
  
      els.featured.innerHTML=''; featured.forEach(r=> els.featured.appendChild(buildCard(r)));
      els.grid.innerHTML='';     rest.forEach(r=> els.grid.appendChild(buildCard(r)));
  
      els.empty.style.display = arr.length ? 'none' : '';
    }
  
    async function init(){
      try{
        const cached = cacheGet();
        repos = cached || await fetchReposLive();
        if(!cached) cacheSet(repos);
      }catch(err){
        // fallback to local JSON
        try { repos = await fetchReposFallback(); }
        catch(e) {
          console.warn('Portfolio: failed to load from GitHub and fallback.');
          els.featured.innerHTML = '';
          els.grid.innerHTML = '<div class="col-12"><div class="card item"><p>Could not load repositories. Add a fallback at <code>data/projects.json</code> or try again later.</p></div></div>';
          els.empty.style.display='none';
          return;
        }
      }
  
      repos.forEach(r=>{ if(!Array.isArray(r.topics)) r.topics = []; });
      const chips = deriveChips(repos);
      renderChips(chips);
  
      els.search.addEventListener('input', applyFilters);
      els.sort.addEventListener('change', applyFilters);
      els.hideArchived.addEventListener('change', applyFilters);
  
      filtered = repos;
      sortAndRender();
    }
  
    init();
  })();
  