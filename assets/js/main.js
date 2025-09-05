// basic interactivity
(function(){
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const groundingBtn = document.getElementById('grounding-btn');
  const overlay = document.getElementById('grounding-overlay');
  const closeBtn = document.getElementById('grounding-close');
  const ball = document.getElementById('breath-ball');
  const instruction = document.getElementById('grounding-instruction');
  let animTimer = null;

  if(groundingBtn){ groundingBtn.addEventListener('click', openGrounding); }
  if(closeBtn){ closeBtn.addEventListener('click', closeGrounding); }
  if(overlay){ overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeGrounding(); }); }

  function openGrounding(){
    if(!overlay){ return legacyRunOnButton(); }
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Reset circle animation so it always restarts cleanly
    if(ball){
      ball.style.animation = 'none';
      ball.style.transform = 'scale(1)';
      // force reflow to allow reapplying animations
      void ball.offsetWidth;
    }
    runBreathingSequence();
  }

  function closeGrounding(){
    if(animTimer){ clearTimeout(animTimer); animTimer = null; }
    if(overlay){ overlay.style.display = 'none'; }
    document.body.style.overflow = '';
    if(ball){ ball.style.transform = 'scale(1)'; }
  }

  // Fallback to old inline text sequence on the button if overlay missing
  function legacyRunOnButton(){
    const steps = [
      'Inhale gently… 4 counts',
      'Hold… 4 counts',
      'Exhale slowly… 6 counts',
      'Notice: 3 things you see',
      'Notice: 2 things you feel',
      'Notice: 1 thing you hear',
      'You are safe. You are not alone.'
    ];
    let i = 0; const btn = groundingBtn; const orig = btn.textContent; btn.disabled = true;
    const interval = setInterval(()=>{
      btn.textContent = steps[i++];
      if(i >= steps.length){
        clearInterval(interval);
        setTimeout(()=>{ btn.disabled = false; btn.textContent = orig; }, 1200);
      }
    }, 1600);
  }

  // New breathing overlay sequence
  function runBreathingSequence(){
    // Durations (ms)
    const inhale = 4000; // 4s
    const hold = 4000;   // 4s
    const exhale = 6000; // 6s
    const pause = 800;   // small rest between instructions

    let cycle = 0;
    const maxCycles = 1; // one cycle then grounding prompts

    function stepInhale(){
      if(instruction) instruction.textContent = 'Inhale gently… 4';
      if(ball){
        ball.style.animation = `breath-in ${inhale}ms ease-in forwards`;
      }
      animTimer = setTimeout(stepHold, inhale + pause);
    }
    function stepHold(){
      if(instruction) instruction.textContent = 'Hold… 4';
      animTimer = setTimeout(stepExhale, hold + pause);
    }
    function stepExhale(){
      if(instruction) instruction.textContent = 'Exhale slowly… 6';
      if(ball){
        ball.style.animation = `breath-out ${exhale}ms ease-out forwards`;
      }
      animTimer = setTimeout(()=>{
        cycle++;
        if(cycle >= maxCycles){
          showGroundingPrompts();
        }else{
          stepInhale();
        }
      }, exhale + pause);
    }
    stepInhale();
  }

  function showGroundingPrompts(){
    const prompts = [
      'Notice: 3 things you can see',
      'Notice: 2 things you can feel',
      'Notice: 1 thing you can hear',
      'You are safe. You are not alone.'
    ];
    let i = 0;
    function next(){
      if(!instruction) return;
      instruction.textContent = prompts[i++];
      if(i < prompts.length){ animTimer = setTimeout(next, 1800); }
      else { animTimer = setTimeout(closeGrounding, 2000); }
    }
    next();
  }
})();

// Anonymous check-in submission (optional)
(function(){
  const form = document.getElementById('checkin-form');
  if(!form) return;
  const mood = document.getElementById('checkin-mood');
  const note = document.getElementById('checkin-note');
  const msg  = document.getElementById('checkin-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Sending…';
    msg.style.color = '#b9c2dd';
    try{
  const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: mood.value, note: note.value })
      });
      const data = await res.json();
      if(!res.ok || !data.ok){ throw new Error(data.error || 'Request failed'); }
      msg.textContent = 'Saved anonymously.';
      msg.style.color = '#36b38a';
      form.reset();
    }catch(err){
      msg.textContent = 'Failed: ' + err.message;
      msg.style.color = '#d13f5b';
    }
  });
})();
