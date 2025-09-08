import { useEffect, useRef, useState } from 'react';

let zCounter = 1;

function DraggableCard({ id, initial, width = 420, children, className = '', style = {}, tape = 'both', gridSize = 26, draggable = true }) {
  const [pos, setPos] = useState({ x: initial.x, y: initial.y });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const zRef = useRef(1);
  const cardRef = useRef(null);
  const posRef = useRef(pos);

  useEffect(() => { posRef.current = pos; }, [pos]);

  useEffect(() => {
    function onMove(e) {
      if (!dragging) return;
      const p = 'touches' in e ? e.touches[0] : e;
      const next = {
        x: p.clientX - startRef.current.x + offsetRef.current.x,
        y: p.clientY - startRef.current.y + offsetRef.current.y
      };
      setPos(next);
      e.preventDefault();
    }
    function onUp() {
      if (!dragging) return;
      setDragging(false);
      // Snap to grid
      setPos(prev => ({
        x: Math.round(prev.x / gridSize) * gridSize,
        y: Math.round(prev.y / gridSize) * gridSize
      }));
      document.body.style.userSelect = '';
      // notify layout consumers (desktop container height)
      window.dispatchEvent(new Event('cards:layout'));
      document.removeEventListener('pointermove', onMove, { passive: false });
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    }
    if (dragging) {
      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp, { passive: false });
    }
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [dragging, gridSize]);

  function onDown(e) {
    if (!draggable) return;
    const p = 'touches' in e ? e.touches[0] : e;
    startRef.current = { x: p.clientX, y: p.clientY };
    offsetRef.current = { x: posRef.current.x, y: posRef.current.y };
    setDragging(true);
    document.body.style.userSelect = 'none';
    zRef.current = ++zCounter;
    if (cardRef.current) {
      cardRef.current.style.zIndex = String(zRef.current);
      cardRef.current.style.setProperty('--lift-rot', `${(Math.random() * 4 - 2).toFixed(2)}deg`);
    }
  }

  return (
    <div
      ref={cardRef}
      data-id={id}
      className={`taped-card${dragging ? ' is-dragging' : ''} ${className}`}
      onPointerDown={draggable ? onDown : undefined}
      onTouchStart={draggable ? onDown : undefined}
      style={{
        width,
        left: pos.x,
        top: pos.y,
        ...style
      }}
    >
      {tape === 'left' || tape === 'both' ? <span className="tape tape-left" /> : null}
      {tape === 'right' || tape === 'both' ? <span className="tape tape-right" /> : null}
      {children}
    </div>
  );
}

function Dashboard() {
  // Responsive column sizing + reflow on resize
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  useEffect(() => {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const gap = 28;
  const margin = 40;
  const isMobile = vw < 900;
  const colW = Math.round(isMobile ? Math.max(280, vw - 2 * margin) : Math.min(560, Math.max(360, vw * 0.30)));
  const leftX = margin;
  const centerX = margin + colW + gap;
  const rightX = margin + (colW + gap) * 2;

  // ... existing code ...

  function computeLayout(vw, colW, gap, margin) {
    const mode = vw >= 1280 ? 3 : vw >= 900 ? 2 : 1;
    const x = [margin, margin + colW + gap, margin + (colW + gap) * 2];
    const L = {};
    if (mode === 3) {
      L.titleContact = { x: x[0], y: 100 }; L.education = { x: x[0], y: 540 }; L.projects = { x: x[0], y: 900 };
      L.experience = { x: x[1], y: 100 };
      L.skills = { x: x[2], y: 100 }; L.leadership = { x: x[2], y: 820 };
      L.loveCenter = { x: x[1], y: 1250 };
      L.loveRight = { x: x[2], y: 1200 };
    } else if (mode === 2) {
      L.titleContact = { x: x[0], y: 100 }; L.education = { x: x[0], y: 620 }; L.projects = { x: x[0], y: 1100 };
      L.experience = { x: x[1], y: 100 }; L.skills = { x: x[1], y: 1280 }; L.leadership = { x: x[1], y: 1720 };
      L.loveCenter = { x: x[1], y: 980 };
      L.loveRight = { x: x[1], y: 2100 };
    } else {
      let y = 100;
      L.titleContact = { x: x[0], y: y }; y += 500;
      L.experience = { x: x[0], y: y }; y += 680;
      L.loveCenter = { x: x[0], y: y }; y += 380;
      L.skills = { x: x[0], y: y }; y += 560;
      L.leadership = { x: x[0], y: y }; y += 460;
      L.loveRight = { x: x[0], y: y }; y += 380;
      L.education = { x: x[0], y: y }; y += 460;
      L.projects = { x: x[0], y: y };
    }
    return L;
  }

  const layout = computeLayout(vw, colW, gap, margin);

  const [activeTab, setActiveTab] = useState('About');
  const tabs = ['About', 'Skills', 'Experience', 'Education', 'Projects', 'Leadership'];

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const idByTab = {
    About: 'titleContact',
    Skills: 'skills',
    Experience: 'experience',
    Education: 'education',
    Projects: 'projects',
    Leadership: 'leadership',
  };

  const funFacts = [
    "I once presented a startup idea to our university's Industry Advisory Board with the dean and the president present!",
    "I've built 50+ CS projects!",
    "I've won $4,000+ in hackathon awards!",
    "I've watched every Marvel movie in theatres!",
    "Every time I've won a hackathon at Georgia Tech, the Indian cricket team won a match the same day!",
    "I've lived in 2 countries, 3 states, and 4 cities!",
    "I've attended more than 10 different schools/universities!",
    "I once got caught up in an minor avalanche while skiing!"
  ];

  const funFactTargets = ['titleContact', 'skills', 'experience', 'education', 'projects', 'leadership', 'loveCenter', 'loveRight'];
  const funFactById = Object.fromEntries(
    funFactTargets.map((id, i) => [id, funFacts[i % funFacts.length]])
  );

  function scrollToCardById(id, opts = {}) {
    const { wiggle = false } = opts;
    const el = document.querySelector(`.taped-card[data-id="${id}"]`);
    if (!el) return;

    const scrollerEl = document.querySelector('.notebook');
    const scroller = (scrollerEl && scrollerEl.scrollHeight > scrollerEl.clientHeight) ? scrollerEl : window;
    const nav = document.querySelector('.nav-card');
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const extra = 16;

    let targetTop = 0;

    if (scroller === window) {
      const y = el.getBoundingClientRect().top + window.scrollY - (isMobile ? (navH + extra) : 80);
      targetTop = y;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      const r = el.getBoundingClientRect();
      const rootR = scroller.getBoundingClientRect();
      const base = r.top - rootR.top + scroller.scrollTop;
      const offset = isMobile ? (navH + extra) : 80;
      targetTop = Math.max(0, base - offset);
      scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
    }

    if (!wiggle) return;

    const getScrollTop = () => (scroller === window ? window.scrollY : scroller.scrollTop);

    const check = () => {
      if (Math.abs(getScrollTop() - targetTop) < 2) {
        const target = document.querySelector(`.taped-card[data-id="${id}"]`);
        if (target) { target.classList.remove('wiggle'); void target.offsetWidth; target.classList.add('wiggle'); }
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  function openMenu() { setMenuVisible(true); requestAnimationFrame(() => setMenuOpen(true)); }
  function closeMenu() { setMenuOpen(false); setTimeout(() => setMenuVisible(false), 300); }

  function handleNavClick(t) {
    setActiveTab(t);
    const id = idByTab[t];
    if (!id) return;
    if (isMobile) {
      scrollToCardById(id);
      closeMenu();
    } else {
      scrollToCardById(id, { wiggle: true });
    }
  }

  const stackStyle = isMobile
    ? { position: 'relative', width: 'calc(100% - 56px)', left: 'auto', top: 'auto', margin: '0 auto', marginBottom: gap + 8 }
    : {};
  // Desktop: dynamically size container to fit absolute-positioned cards
  const [docH, setDocH] = useState(0);
  function recalcDocHeight() {
    if (isMobile) return;
    const notebook = document.querySelector('.notebook');
    if (!notebook) return;
    const topOffset = notebook.getBoundingClientRect().top + window.scrollY;
    let maxBottom = 0;
    document.querySelectorAll('.taped-card:not(.nav-card)').forEach(el => {
      const r = el.getBoundingClientRect();
      const bottom = r.bottom + window.scrollY;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    const contentBottom = Math.max(0, maxBottom - topOffset);
    // add small cushion
    setDocH(Math.ceil(contentBottom + 24));
  }
  useEffect(() => {
    recalcDocHeight();
    const onResize = () => recalcDocHeight();
    const onLayout = () => recalcDocHeight();
    window.addEventListener('resize', onResize);
    window.addEventListener('cards:layout', onLayout);
    // recalc after initial paint
    const t = setTimeout(recalcDocHeight, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('cards:layout', onLayout);
    };
  }, [isMobile, vw]);

  // Prebuild cards to control order on mobile vs desktop
  const skillsCard = (
    <DraggableCard
      key={`skills-${colW}`}
      id="skills"
      width={colW}
      initial={layout.skills}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#f7fff2' }}
    >
      <div className="section-title">Technical Skills</div>
      <div className="subsection">Languages & Frameworks</div>
      <div className="chips">
        <span className="chip">Python</span>
        <span className="chip">JavaScript</span>
        <span className="chip">C/C++</span>
        <span className="chip">ReactJS</span>
        <span className="chip">NodeJS</span>
        <span className="chip">Flask</span>
        <span className="chip">LangChain</span>
        <span className="chip">GitHub Actions</span>
        <span className="chip">GitLab CI/CD</span>
      </div>
      <div className="subsection" style={{ marginTop: 12 }}>Tools & Platforms</div>
      <div className="chips">
        <span className="chip alt">Google Cloud Platform (2+ YOE)</span>
        <span className="chip alt">Vertex AI</span>
        <span className="chip alt">AWS</span>
        <span className="chip alt">Docker</span>
        <span className="chip alt">Kubernetes</span>
        <span className="chip alt">Linux</span>
        <span className="chip alt">Unix</span>
        <span className="chip alt">Azure</span>
        <span className="chip alt">Agile</span>
      </div>
      <div className="subsection" style={{ marginTop: 12 }}>Databases & Analytics</div>
      <div className="chips">
        <span className="chip">Looker Studio</span>
        <span className="chip">MongoDB</span>
        <span className="chip">SQL</span>
        <span className="chip">Firebase</span>
        <span className="chip">Tableau</span>
        <span className="chip">PowerBI</span>
        <span className="chip">Redis</span>
        <span className="chip">BigQuery</span>
        <span className="chip">Vector DB</span>
      </div>
      <div className="subsection" style={{ marginTop: 12 }}>Security</div>
      <div className="chips">
        <span className="chip alt">Google SecOps</span>
        <span className="chip alt">IAM</span>
        <span className="chip alt">Workload Identity Federation</span>
        <span className="chip alt">SentinelOne Automation</span>
        <span className="chip alt">Auth0</span>
        <span className="chip alt">Okta</span>
      </div>
      <div className="subsection" style={{ marginTop: 12 }}>Certifications</div>
      <div className="chips">
        <span className="chip">Microsoft Azure Fundamentals - AZ-900</span>
        <span className="chip">Microsoft Azure AI Fundamentals - AI-900</span>
      </div>
    </DraggableCard>
  );

  const experienceCard = (
    <DraggableCard
      key={`experience-${colW}`}
      id="experience"
      width={colW}
      initial={layout.experience}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#fff6fb' }}
    >
      <div className="section-title">Experience</div>

      <div className="subsection">Cybriant - Software Engineer</div>
      <div className="meta">May 2024 - Present</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Architected multi-tenant SecOps SaaS platform</span><span className="bullet-rest"> — React + Flask + GCP stack with Auth0 authentication and Workload Identity Federation for secure multi-tenancy.</span></li>
        <li><span className="bullet-tldr">Scaled to 5 Partner Organizations and 1000+ enterprise customers</span><span className="bullet-rest"> — serving 10,000+ endpoints; reduced onboarding from days to minutes through automated provisioning.</span></li>
        <li><span className="bullet-tldr">Built cloud-native infrastructure</span><span className="bullet-rest"> — Cloud Run, Cloud Build, Artifact Registry, API Gateway ensuring controlled access and safe operations.</span></li>
        <li><span className="bullet-tldr">Optimized data pipeline performance</span><span className="bullet-rest"> — Python + Cloud Run Jobs + BigQuery + Looker Studio; reduced runtime from hours to minutes (75% throughput improvement).</span></li>
        <li><span className="bullet-tldr">Led 15-person intern program</span><span className="bullet-rest"> — directed 3 cross-functional teams building Attack Surface Management system; won 1st place at KSU Capstone (500+ students, 50 projects).</span></li>
        <li><span className="bullet-tldr">Deployed AI-driven SOC automation</span><span className="bullet-rest"> — Google Agent Development Kit (ADK) for critical security workflows and alert triage.</span></li>
      </ul>

      <div className="subsection" style={{ marginTop: 30 }}>Cybriant - Software Engineer Intern</div>
      <div className="meta">May 2023 - Apr 2024</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Built QSR reporting platform</span><span className="bullet-rest"> — React + Flask with API integrations; eliminated 10+ hours of manual work per client per quarter.</span></li>
        <li><span className="bullet-tldr">Rebuilt legacy healthcheck system</span><span className="bullet-rest"> — Python + GCP Cloud Run Jobs; 90% performance improvement (2 hours → 10 minutes), saving $40k/year in SOC operations.</span></li>
        <li><span className="bullet-tldr">Standardized security log parsing</span><span className="bullet-rest"> — Python parsers mapping sources to Unified Data Model (UDM); reduced detection triage by 10 minutes per event.</span></li>
      </ul>

      <div className="subsection" style={{ marginTop: 30 }}>Georgia State University - Undergraduate Research Assistant</div>
      <div className="meta">Aug 2023 - May 2024</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Developed C++ Image Metadata Management System</span><span className="bullet-rest"> — high-performance data storage and retrieval for research workflows.</span></li>
        <li><span className="bullet-tldr">Integrated ADIOS2 with OpenCV and SQL</span><span className="bullet-rest"> — created adaptable I/O system for large-scale image processing pipelines.</span></li>
      </ul>
    </DraggableCard>
  );

  const educationCard = (
    <DraggableCard
      key={`education-${colW}`}
      id="education"
      width={colW}
      initial={layout.education}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#e9f4ff' }}
    >
      <div className="section-title">Education</div>

      <div className="subsection">Georgia Institute Of Technology</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Masters in Computer Science</span><span className="bullet-rest"> — Specialization: Machine Learning; Computer Networking; Network Security.</span></li>
      </ul>

      <div className="subsection" style={{ marginTop: 10 }}>Georgia State University</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">BSc in Computer Science, GPA 4.0</span><span className="bullet-rest"> — Honors College; Coursework: ML, Algorithms, Computer Organization, Data Structures.</span></li>
      </ul>
    </DraggableCard>
  );

  const projectsCard = (
    <DraggableCard
      key={`projects-${colW}`}
      id="projects"
      width={colW}
      initial={layout.projects}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#fff' }}
    >
      <div className="section-title">Projects</div>

      <div className="subsection">BullRunAI</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Fintech social platform</span><span className="bullet-rest"> — ReactJS + Cloud Run delivering real-time market data, price forecasting, and sentiment analysis.</span></li>
        <li><span className="bullet-tldr">Integrated trading APIs</span><span className="bullet-rest"> — SnapTrade API, Polygon API, and TradingView charts for comprehensive market insights.</span></li>
      </ul>
      <div className="meta">Winner - Best Generative AI Hack @ Hackalytics 2025, Georgia Tech (250+ projects, 1200+ students)</div>
      <div className="link-row">
        <a className="pill-link" href="#" target="_blank" rel="noreferrer">View Announcement</a>
      </div>

      <div className="subsection" style={{ marginTop: 12 }}>Kapstone</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">AI-powered project matching SaaS</span><span className="bullet-rest"> — ReactJS + ExpressJS + Supabase with embeddings-based student-project pairing system.</span></li>
        <li><span className="bullet-tldr">Built with academic leadership</span><span className="bullet-rest"> — collaborated with CS Dean and Industry Advisory Board for real-world validation.</span></li>
      </ul>
      <div className="meta">Raised $25k+ from Microsoft for Startups and Startup Exchange GT; 3rd Place @ SX Summit (30+ startups)</div>
      <div className="link-row">
        <a className="pill-link" href="#" target="_blank" rel="noreferrer">View Announcement</a>
      </div>

      <div className="subsection" style={{ marginTop: 12 }}>HealthSync</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">AI healthcare communication platform</span><span className="bullet-rest"> — Azure TTS + Azure AI Communication + LangChain with 2D photorealistic avatar.</span></li>
        <li><span className="bullet-tldr">Smart patient interaction system</span><span className="bullet-rest"> — automated scheduling, contextual chat processing, and Logistic Regression Model for personalization.</span></li>
      </ul>
      <div className="meta">Winner - Best Healthcare Hack @ Hackalytics 2024, Georgia Tech (200+ projects, 1000+ students)</div>
      <div className="link-row">
        <a className="pill-link" href="#" target="_blank" rel="noreferrer">View Announcement</a>
      </div>
    </DraggableCard>
  );

  const leadershipCard = (
    <DraggableCard
      key={`leadership-${colW}`}
      id="leadership"
      width={colW}
      initial={layout.leadership}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#f3f3ff' }}
    >
      <div className="section-title">Leadership & Community</div>
      <ul className="bullets">
        <li><span className="bullet-tldr">Team Lead</span><span className="bullet-rest"> — 15 interns; agent‑based ASM platform; 1st place at KSU Capstone 2024.</span></li>
        <li><span className="bullet-tldr">7× Hackathon Winner</span><span className="bullet-rest"> — Hackalytics 2025; Hackalytics 2024; AIATL 2024; Demo Day GSU 2024; GameJam 2023; SAA 2022.</span></li>
        <li><span className="bullet-tldr">Hackathon Judge</span><span className="bullet-rest"> — HackGT11 2024 (500+); HackHers 2024 (150+); KSU C‑Day (500+).</span></li>
        <li><span className="bullet-tldr">Industry Advisory Board</span><span className="bullet-rest"> — Kennesaw State University SWE Program.</span></li>
      </ul>
    </DraggableCard>
  );

  const wallOfLoveCard = (
    <DraggableCard
      key={`loveCenter-${colW}`}
      id="loveCenter"
      width={colW}
      initial={layout.loveCenter}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#fff7fb' }}
    >
      <div className="section-title">Wall of Love</div>
      <ul className="love-quotes">
        <li className="quote">“Pramit ships fast and safe - our onboarding time dropped dramatically.”</li>
        <li className="quote">“Turns fuzzy ideas into clean, reliable services.”</li>
        <li className="quote">“Collaborative, calm, and relentless about quality.”</li>
      </ul>
    </DraggableCard>
  );

  const loveRightCard = (
    <DraggableCard
      key={`loveRight-${colW}`}
      id="loveRight"
      width={colW}
      initial={layout.loveRight}
      tape="both"
      draggable={!isMobile}
      style={{ ...stackStyle, background: '#fff7e6' }}
    >
      <div className="section-title">Notes of Thanks</div>
      <ul className="love-quotes">
        <li className="quote">“Great teammate - unblocked our pipeline migration.”</li>
        <li className="quote">“Owns problems end‑to‑end and communicates clearly.”</li>
      </ul>
    </DraggableCard>
  );

  const [showDragModal, setShowDragModal] = useState(false);

  useEffect(() => {
    if (!isMobile) setShowDragModal(true);
  }, [isMobile]);

  useEffect(() => {
    if (!showDragModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setShowDragModal(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [showDragModal]);

  return (
    <div className={`notebook${isMobile ? ' is-mobile' : ''}`}>
      <style>{`
              :root{
          --grid-size: 26px;
          --grid-line: rgba(0,0,0,.08);
          --paper-bg: #fdfdfc;
          --ink: #242424;
          --card-bg: #fff;
          --card-shadow: 0 12px 32px rgba(0,0,0,.12), 0 2px 10px rgba(0,0,0,.06);
          --tape: rgba(255,255,255,.65);
          --tape-edge: rgba(0,0,0,.18);
          --brand: #111;
          --brand-accent: #c6f68d;
          --muted: #6b7280;
          --link: #0f62fe;
          --radius: 18px;
        }
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow-x: hidden; }
        .notebook{
          position: relative;
          height: 100vh;
          background:
            repeating-linear-gradient(0deg, transparent 0 var(--grid-size), var(--grid-line) var(--grid-size) calc(var(--grid-size) + 1px)),
            repeating-linear-gradient(90deg, transparent 0 var(--grid-size), var(--grid-line) var(--grid-size) calc(var(--grid-size) + 1px)),
            var(--paper-bg);
          overflow-x: hidden;
          overflow-y: auto;
          padding: 48px 10px 20px;
          max-width: 100%;
          width: 100%;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji";
          color: var(--ink);
        }

        .taped-card{
          position:absolute;
          background: var(--card-bg);
          border-radius: var(--radius);
          box-shadow: var(--card-shadow);
          padding: 18px 20px;
          user-select: none;
          touch-action: none;
          transform: none;
          cursor: grab;
          transform-origin: 50% 12%;
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
          z-index: 1;
        }
          
        .taped-card .tape{
          position:absolute;
          width: 82px; height: 28px;
          top: -16px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.8), rgba(255,255,255,.55)),
            repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,.4) 6px 12px);
          border: 1px solid var(--tape-edge);
          border-radius: 4px;
          box-shadow: 0 6px 12px rgba(0,0,0,.15);
          mix-blend-mode: multiply;
          opacity: .95;
        }
        .taped-card .tape-left{ left: 22px; transform: rotate(-6deg); }
        .taped-card .tape-right{ right: 22px; transform: rotate(5deg); }

        /* brand/title card */
        .title-card{
          background: var(--brand);
          color: #fff;
          padding: 26px 28px;
          border-radius: var(--radius);
          transform: none;
        }
        .title-badge{
          display:flex; align-items:center; gap:14px;
        }
        .title-logo{
          width:56px;height:56px;border-radius:14px;
          background: var(--brand-accent);
          display:grid; place-items:center;
          box-shadow: inset 0 0 0 3px #1118, 0 8px 24px rgba(0,0,0,.3);
        }
        .smiley{
          width:28px;height:28px;border:3px solid #111;border-radius:50%;
          display:block; position:relative;
        }
        .smiley:before,.smiley:after{
          content:''; position:absolute; background:#111; width:5px; height:5px; border-radius:50%;
          top:8px;
        }
        .smiley:before{ left:6px; }
        .smiley:after{ right:6px; }
        .smiley span{
          position:absolute; left:6px; right:6px; bottom:5px; height:10px;
          border-bottom:3px solid #111; border-radius:0 0 12px 12px;
        }
        .title-text{
          font-size:40px; font-weight:800; letter-spacing:.2px;
        }
        .title-subtext{
          margin-top:8px; font-weight:600; font-size:18px; opacity:.95;
        }

        /* nav card */
        .nav-card{
          position: fixed !important;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 14px;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 10000;
          touch-action: auto;
          user-select: auto;
        }        
        .nav-inner{ display:flex; align-items:center; gap:10px; }
        .nav-title{
          font-weight:800; font-size:16px; letter-spacing:.2px; color:#111; opacity:.9;
        }
        .hamburger{
          display:none;
          background:#111; color:#fff; border:none;
          border-radius:10px; padding:12px 12px; cursor:pointer; box-shadow: 0 3px 8px rgba(0,0,0,.08);
        }
        .hamburger .bars{
          display:block; width:18px; height:2px; background:#fff; position:relative;
        }
        .hamburger .bars:before,.hamburger .bars:after{
          content:''; position:absolute; left:0; right:0; height:2px; background:#fff;
        }
        .hamburger .bars:before{ top:-6px; }
        .hamburger .bars:after{ top:6px; }
        .mobile-menu{
          position:fixed; top:96px; left:28px; right:28px; bottom:24px;
          background:#fff; border:1px solid rgba(0,0,0,.12); border-radius:12px;
          box-shadow: var(--card-shadow); padding:14px; z-index:10001;
          overflow-y:auto;
          transform: translateY(-12px);
          opacity: 0;
          transition: transform 280ms ease, opacity 280ms ease;
        }
        .mobile-menu.open{ transform: translateY(0); opacity: 1; }
        .menu-title{ font-weight:800; font-size:14px; letter-spacing:.2px; color:#111; margin:2px 2px 10px; opacity:.9; }
        .menu-item{ padding:10px 12px; border-radius:8px; font-weight:600; cursor:pointer; }
        .menu-item.active{ background:#111; color:#fff; }
        .menu-overlay{ position:fixed; inset:0; background:transparent; z-index:10000; }

        /* content cards */
        /* content cards */
        .section-title{
          font-family: "Georgia", ui-serif, serif;
          font-weight: 800;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .subsection{
          font-weight:700; margin-top:8px; margin-bottom:0px;
        }
        .meta{
          color: var(--muted); font-size: 13px; margin-bottom: 10px;
        }
        .bullets{
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
          color: var(--muted);
          line-height: 1.2;
          font-size: 14px;
        }
        .bullets li{ margin: 20px 0; }
        .bullets .bullet-tldr{ font-weight: 800; color: var(--ink); }
        .bullets .bullet-rest{ font-size: 12px; margin-left: 4px; }
        .chips{ display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .chip{
          font-size:12px; padding:6px 10px; border-radius:999px; background:#fff6d9; border:1px dashed #e4cf7a;
        }
        .chip.alt{
          background:#eef6ff; border:1px dashed #bcd6ff;
        }
        .link-row{
          display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;
        }
        .pill-link{
          text-decoration:none; color:#111; background:#f5f7ff; border:1px solid rgba(0,0,0,.06);
          padding:6px 10px; border-radius:999px; font-weight:600; font-size:13px;
        }
        .love-quotes{ list-style:none; padding:0; margin:0; display:grid; gap:10px; }
        .love-quotes .quote{
          background:#fff; border:1px dashed rgba(0,0,0,.08); border-radius:12px; padding:10px 12px;
          font-style:italic; color: var(--muted);
        }

        .footer{
          position: static;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(0,0,0,.12);
          border-radius: 14px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color:#111;
          padding:10px 14px;
          margin: 24px auto 16px;
          z-index: 1;
          box-shadow: var(--card-shadow);
          width: fit-content;
        }
        .footer .links{ display:flex; justify-content:center; gap:12px; }
        .footer .icon-btn{
          width:36px; height:36px; display:grid; place-items:center; border-radius:999px;
          background: rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.14); color:#111; text-decoration:none;
        }
        .footer .icon-btn svg{ width:18px; height:18px; fill:currentColor; }
        
        /* fun facts behind cards */
        .fun-fact{
          position:absolute;
          background: rgba(255,255,255,0.7);
          border: 1px dashed rgba(0,0,0,.18);
          border-radius: 12px;
          padding: 10px 12px;
          color: var(--muted);
          font-size: 13px;
          font-style: italic;
          line-height: 1.35;
          pointer-events: none;
          z-index: 0;
        }

        /* desktop footer spacer (pushes in-flow footer below absolute cards) */
        .footer-spacer{ display:block; height:0; }
        @media (min-width: 900px) {
          .tabs { display:flex; gap:8px; }
          .hamburger { display:none; }
          .tab{
            background:#f5f7ff;
            border:1px solid rgba(0,0,0,.06);
            padding:8px 12px;
            border-radius:999px;
            font-weight:600;
            font-size:14px;
            box-shadow: 0 3px 8px rgba(0,0,0,.08);
            cursor: pointer;
          }
          .tab.active{ background:#111; color:#fff; }
        }
        @keyframes wiggle {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          20% { transform: translateY(-2px) rotate(-1deg); }
          40% { transform: translateY(2px) rotate(1deg); }
          60% { transform: translateY(-2px) rotate(-1deg); }
          80% { transform: translateY(1px) rotate(0.6deg); }
          100% { transform: none; }
        }
        .taped-card.wiggle { animation: wiggle 600ms ease; will-change: transform; }
        .taped-card.is-dragging{
          transform: rotate(var(--lift-rot, 0deg)) translateY(-2px) scale(1.02);
          box-shadow:
            0 22px 40px rgba(0,0,0,.22),
            0 6px 18px rgba(0,0,0,.16);
          cursor: grabbing;
          filter: saturate(.95) contrast(.98);
        }
        .taped-card.is-dragging:after{
          content:'';
          position:absolute;
          left:-14px; right:-14px; top:-8px; bottom:-18px;
          pointer-events:none;
          background: radial-gradient(ellipse at 50% 100%, rgba(0,0,0,.22), transparent 55%);
          filter: blur(6px);
          opacity:.7;
          z-index:-1;
        }
        .taped-card.is-dragging .tape-left{ transform: rotate(-10deg); }
        .taped-card.is-dragging .tape-right{ transform: rotate(9deg); }

        /* Desktop nav pills (ensure buttons + spacing + active state) */
        @media (min-width: 900px) {
          .tabs { display:flex; gap:8px; }
          .hamburger { display:none; }
          .tab{
            background:#f5f7ff;
            border:1px solid rgba(0,0,0,.06);
            padding:8px 12px;
            border-radius:999px;
            font-weight:600;
            font-size:14px;
            box-shadow: 0 3px 8px rgba(0,0,0,.08);
            cursor: pointer;
          }
          .tab.active{ background:#111; color:#fff; }
        }

        .drag-modal-overlay{
          position: fixed;
          inset: 0;
          background: rgba(17,17,17,.45);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 10050; /* above nav-card (10000) */
          display: grid;
          place-items: center;
        }
        .drag-modal{
          background:#fff;
          color:#111;
          border-radius:14px;
          box-shadow: var(--card-shadow);
          width: min(520px, calc(100% - 56px));
          padding:18px 20px;
          text-align:center;
        }
        .drag-modal-title{ font-weight:800; font-size:18px; margin-bottom:8px; }
        .drag-modal-body{ font-size:14px; color: var(--muted); }
        .drag-modal-actions{ margin-top:16px; display:flex; justify-content:center; }
        .drag-modal-btn{
          background:#111; color:#fff; border:none; border-radius:10px;
          padding:8px 14px; font-weight:700; cursor:pointer;
        }
        @media (max-width: 899px){ .drag-modal-overlay{ display:none; } }
        
        @media (max-width: 899px) {
          .tabs { display:none; }
          .hamburger { display:inline-flex; align-items:center; justify-content:center; }
          .notebook { padding-top: 96px; }
          .is-mobile .taped-card { touch-action: auto; max-width: 100%; }
          .nav-card { left: 28px; right: 28px; transform: none; width: auto; padding: 16px 18px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,.12); border-radius: 14px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
          .nav-inner { justify-content: space-between; }
        }
        
        .nav-icons{ display:flex; gap:8px; align-items:center; }
        .nav-icon{
          width:32px; height:32px; display:grid; place-items:center; border-radius:8px;
          background: rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.14); color:#111; text-decoration:none;
          transition: all 150ms ease;
        }
        .nav-icon:hover{ background: rgba(0,0,0,0.1); }
        .nav-icon svg{ width:16px; height:16px; fill:currentColor; }
        @media (max-width: 899px) {
          .nav-icons { display:none; }
          .mobile-nav-icons { display:flex; gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid rgba(0,0,0,0.1); }
          .mobile-nav-icon {
            width:36px; height:36px; display:grid; place-items:center; border-radius:8px;
            background: rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.14); color:#111; text-decoration:none;
          }
          .mobile-nav-icon svg{ width:18px; height:18px; fill:currentColor; }
        }
        @media (min-width: 900px) {
          .mobile-nav-icons { display:none; }
        }
        
        `}</style>


      {/* Navigation card */}
      <DraggableCard
        id="nav"
        width="fit-content"
        initial={{ x: 500, y: 0 }}
        className="nav-card"
        tape="none"
        draggable={false}
        style={isMobile
          ? { left: 28, right: 28, top: 8, transform: 'none', zIndex: 10000, position: 'fixed', width: 'auto' }
          : { left: '50%', top: 8, transform: 'translateX(-50%)', zIndex: 10000, position: 'fixed' }}
      >
        <div className="nav-inner">
          <button className="hamburger" aria-label="Menu" onClick={() => (menuOpen ? closeMenu() : openMenu())}>
            <span className="bars" />
          </button>
          {isMobile && <div className="nav-title">Welcome!</div>}
          <div className="tabs" role="tablist" aria-label="Sections">
            {tabs.map(t => (
              <span
                key={t}
                role="tab"
                aria-selected={activeTab === t}
                className={`tab${activeTab === t ? ' active' : ''}`}
                onClick={() => handleNavClick(t)}
              >
                {t}
              </span>
            ))}
          </div>
          {!isMobile && (
            <div className="nav-icons">
              <a className="nav-icon" href="https://www.linkedin.com/in/pramit-bhatia/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.6c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.9 1.97-2.9 4v7.74h-5V8z" />
                </svg>
              </a>
              <a className="nav-icon" href="https://drive.google.com/file/d/1rBtBglnxaUu3eKsUfcSFDdgVSjLKjCAJ/view?usp=sharing" aria-label="Resume" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7H8V7h7v2zm0 4H8v-2h7v2zm0 4H8v-2h7v2zM13 3.5L18.5 9H13V3.5z" />
                </svg>
              </a>
              <a className="nav-icon" href="https://github.com/pramitbhatia25" aria-label="GitHub" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53l-.01-1.87c-3.05.66-3.69-1.3-3.69-1.3-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.19.69-1.46-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.42.11-2.96 0 0 .92-.29 3.02 1.13.88-.25 1.82-.37 2.76-.37.94 0 1.88.12 2.76.37 2.1-1.42 3.02-1.13 3.02-1.13.6 1.54.22 2.68.11 2.96.7.77 1.13 1.76 1.13 2.96 0 4.23-2.58 5.15-5.04 5.43.4.35.75 1.03.75 2.08l-.01 3.08c0 .29.2.63.75.53 4.36-1.44 7.51-5.57 7.51-10.43C23.01 5.24 18.27.5 12 .5z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </DraggableCard>

      {isMobile && menuVisible && (
        <>
          <div className="menu-overlay" onClick={closeMenu} />
          <div className={`mobile-menu${menuOpen ? ' open' : ''}`} role="menu">
            {tabs.map(t => (
              <div
                key={t}
                role="menuitem"
                className={`menu-item${activeTab === t ? ' active' : ''}`}
                onClick={() => { handleNavClick(t); }}
              >
                {t}
              </div>
            ))}
            <div className="mobile-nav-icons">
              <a className="mobile-nav-icon" href="https://www.linkedin.com/in/pramit-bhatia/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.6c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.9 1.97-2.9 4v7.74h-5V8z" />
                </svg>
              </a>
              <a className="mobile-nav-icon" href="https://drive.google.com/file/d/1rBtBglnxaUu3eKsUfcSFDdgVSjLKjCAJ/view?usp=sharing" aria-label="Resume" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7H8V7h7v2zm0 4H8v-2h7v2zm0 4H8v-2h7v2zM13 3.5L18.5 9H13V3.5z" />
                </svg>
              </a>
              <a className="mobile-nav-icon" href="https://github.com/pramitbhatia25" aria-label="GitHub" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24">
                  <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53l-.01-1.87c-3.05.66-3.69-1.3-3.69-1.3-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.19.69-1.46-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.42.11-2.96 0 0 .92-.29 3.02 1.13.88-.25 1.82-.37 2.76-.37.94 0 1.88.12 2.76.37 2.1-1.42 3.02-1.13 3.02-1.13.6 1.54.22 2.68.11 2.96.7.77 1.13 1.76 1.13 2.96 0 4.23-2.58 5.15-5.04 5.43.4.35.75 1.03.75 2.08l-.01 3.08c0 .29.2.63.75.53 4.36-1.44 7.51-5.57 7.51-10.43C23.01 5.24 18.27.5 12 .5z" />
                </svg>
              </a>
            </div>
          </div>
        </>
      )}

      {!isMobile && showDragModal && (
        <div className="drag-modal-overlay" role="dialog" aria-modal="true" aria-label="Drag hint">
          <div className="drag-modal">
            <div className="drag-modal-title">Heads up</div>
            <div className="drag-modal-body">Drag around the cards for some fun facts!</div>
            <div className="drag-modal-actions">
              <button className="drag-modal-btn" onClick={() => setShowDragModal(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Combined Title and Contact card */}
      <DraggableCard
        key={`titleContact-${colW}`}
        id="titleContact"
        width={colW}
        initial={layout.titleContact}
        className="title-card"
        tape="both"
        draggable={!isMobile}
        style={stackStyle}
      >
        <div className="title-badge">
          <div>
            <div className="title-text">Pramit Bhatia</div>
            <div className="title-subtext">Software Engineer | Cloud Automation | Full-Stack Development</div>
          </div>
        </div>

        {/* Contact section within the same card */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div className="section-title" style={{ color: '#fff', fontSize: '20px', marginBottom: '12px' }}>Contact</div>
          <ul className="bullets" style={{ color: 'rgba(255,255,255,0.9)', listStyle: 'none', padding: 0, marginBottom: '16px' }}>
            <li style={{ marginBottom: '12px' }}><strong>Phone:</strong> +1 (470)-430-3868</li>
            <li style={{ marginBottom: '12px' }}><strong>Email:</strong> pramitbhatia25@gmail.com</li>
            <li style={{ marginBottom: '12px' }}><strong>Location:</strong> Atlanta, GA</li>
          </ul>
          <div className="link-row" style={{ marginTop: '16px' }}>
            <a className="pill-link" href="https://www.linkedin.com/in/pramit-bhatia/" target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.6c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.9 1.97-2.9 4v7.74h-5V8z" />
              </svg>
              LinkedIn
            </a>
            <a className="pill-link" href="https://drive.google.com/file/d/1rBtBglnxaUu3eKsUfcSFDdgVSjLKjCAJ/view?usp=sharing" target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7H8V7h7v2zm0 4H8v-2h7v2zm0 4H8v-2h7v2zM13 3.5L18.5 9H13V3.5z" />
              </svg>
              Resume
            </a>
            <a className="pill-link" href="https://github.com/pramitbhatia25" target="_blank" rel="noreferrer" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53l-.01-1.87c-3.05.66-3.69-1.3-3.69-1.3-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.19.69-1.46-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.42.11-2.96 0 0 .92-.29 3.02 1.13.88-.25 1.82-.37 2.76-.37.94 0 1.88.12 2.76.37 2.1-1.42 3.02-1.13 3.02-1.13.6 1.54.22 2.68.11 2.96.7.77 1.13 1.76 1.13 2.96 0 4.23-2.58 5.15-5.04 5.43.4.35.75 1.03.75 2.08l-.01 3.08c0 .29.2.63.75.53 4.36-1.44 7.51-5.57 7.51-10.43C23.01 5.24 18.27.5 12 .5z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </DraggableCard>


      {/* Skills and Experience order: desktop = Skills then Experience; mobile = Experience then Skills */}
      {isMobile ? (
        <>
          {experienceCard}
          {educationCard}
          {projectsCard}
          {leadershipCard}
          {skillsCard}
          {wallOfLoveCard}
          {loveRightCard}
        </>
      ) : (
        <>
          {skillsCard}
          {experienceCard}
          {wallOfLoveCard}
          {educationCard}
          {leadershipCard}
          {loveRightCard}
          {projectsCard}
        </>
      )}
      {!isMobile && (
        <>
          {funFactTargets.map((id) => {
            const p = layout[id];
            if (!p) return null;
            return (
              <div
                key={`fact-${id}-${colW}`}
                className="fun-fact"
                style={{
                  left: p.x + 10,
                  top: p.y + 14,
                  width: Math.max(240, colW - 24)
                }}
              >
                {funFactById[id]}
              </div>
            );
          })}
        </>
      )}

      {!isMobile && <div className="footer-spacer" aria-hidden="true" style={{ height: Math.max(0, docH) }} />}
      <footer className="footer" role="contentinfo" aria-label="Footer">
        <div className="links">
          <a className="icon-btn" href="https://www.linkedin.com/in/pramit-bhatia/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.6c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.9 1.97-2.9 4v7.74h-5V8z" /></svg>
          </a>
          <a className="icon-btn" href="https://github.com/pramitbhatia25" aria-label="GitHub" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24"><path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53l-.01-1.87c-3.05.66-3.69-1.3-3.69-1.3-.5-1.26-1.22-1.6-1.22-1.6-.99-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.58 1.19 3.21.91.1-.71.38-1.19.69-1.46-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.42.11-2.96 0 0 .92-.29 3.02 1.13.88-.25 1.82-.37 2.76-.37.94 0 1.88.12 2.76.37 2.1-1.42 3.02-1.13 3.02-1.13.6 1.54.22 2.68.11 2.96.7.77 1.13 1.76 1.13 2.96 0 4.23-2.58 5.15-5.04 5.43.4.35.75 1.03.75 2.08l-.01 3.08c0 .29.2.63.75.53 4.36-1.44 7.51-5.57 7.51-10.43C23.01 5.24 18.27.5 12 .5z" /></svg>
          </a>
          <a className="icon-btn" href="https://drive.google.com/file/d/1rBtBglnxaUu3eKsUfcSFDdgVSjLKjCAJ/view?usp=sharing" aria-label="Resume" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7H8V7h7v2zm0 4H8v-2h7v2zm0 4H8v-2h7v2zM13 3.5L18.5 9H13V3.5z" /></svg>
          </a>
        </div>
      </footer>
    </div>

  );
}

export default Dashboard;