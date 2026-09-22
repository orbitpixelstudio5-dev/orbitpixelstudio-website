(function(){
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.__heroProgress = window.__heroProgress || 0; // read by the Three.js hero scene, if present
  var footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  /* ---------- NAV scroll state ---------- */
  var nav = document.getElementById('siteNav');
  if (nav){
    function onScrollNav(){ nav.classList.toggle('is-scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScrollNav, { passive:true });
    onScrollNav();
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu){
    burger.addEventListener('click', function(){
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mobileMenu.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        burger.setAttribute('aria-expanded','false');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Service card expand (services pages) ---------- */
  document.querySelectorAll('.service-card-head').forEach(function(btn){
    btn.addEventListener('click', function(){
      var card = btn.closest('.service-card');
      var willOpen = !card.classList.contains('is-open');
      document.querySelectorAll('.service-card').forEach(function(c){
        c.classList.remove('is-open');
        c.querySelector('.service-card-head').setAttribute('aria-expanded','false');
      });
      if (willOpen){
        card.classList.add('is-open');
        btn.setAttribute('aria-expanded','true');
      }
    });
  });

  /* ---------- FAQ accordion (services / contact pages) ---------- */
  document.querySelectorAll('.faq-q').forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.faq-item');
      var willOpen = !item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function(i){
        i.classList.remove('is-open');
        i.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if (willOpen){ item.classList.add('is-open'); btn.setAttribute('aria-expanded','true'); }
    });
  });

  /* ---------- Lead modal ---------- */
  var leadModal = document.getElementById('leadModal');
  var leadClose = document.getElementById('leadModalClose');
  var leadForm = document.getElementById('leadForm');
  if (leadModal && leadClose){
    function openLead(){ leadModal.classList.add('is-open'); leadModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
    function closeLead(){ leadModal.classList.remove('is-open'); leadModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    document.querySelectorAll('[data-open-lead]').forEach(function(el){ el.addEventListener('click', function(e){ e.preventDefault(); openLead(); }); });
    leadClose.addEventListener('click', closeLead);
    leadModal.addEventListener('click', function(e){ if (e.target === leadModal) closeLead(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLead(); });

    /* Lead form -> prefilled WhatsApp link (no backend required) */
    if (leadForm){
      leadForm.addEventListener('submit', function(e){
        e.preventDefault();
        var name = document.getElementById('lf-name').value.trim();
        var business = document.getElementById('lf-business').value.trim();
        var service = document.getElementById('lf-service').value;
        var message = document.getElementById('lf-message').value.trim();
        var text = 'Hi Orbit Pixel Studio, I\'m ' + name + (business ? ' from ' + business : '') +
                   '. I\'m interested in ' + service + '.' + (message ? ' ' + message : '');
        var waNumber = '917796016431';
        window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        closeLead();
      });
    }
  }

  /* ---------- Contact page direct form (no popup) -> WhatsApp ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var name = document.getElementById('cf-name').value.trim();
      var business = document.getElementById('cf-business').value.trim();
      var service = document.getElementById('cf-service').value;
      var message = document.getElementById('cf-message').value.trim();
      var text = 'Hi Orbit Pixel Studio, I\'m ' + name + (business ? ' from ' + business : '') +
                 '. I\'m interested in ' + service + '.' + (message ? ' ' + message : '');
      var waNumber = '917796016431';
      window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ---------- GSAP / ScrollTrigger / Lenis ---------- */
  if (!(window.gsap && window.ScrollTrigger) || prefersReduced) document.documentElement.classList.remove('js');
  if (window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    if (!prefersReduced && window.Lenis){
      var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    var heroEl = document.querySelector('.hero.hero--cinematic');
    if (heroEl){
      /* Gentle, non-hijacking scroll progress (0→1 over ~one viewport height) —
         read by the Three.js hero scene for subtle ambient drift. No pinning. */
      var updateHeroProgress = function(){
        var range = window.innerHeight * 0.9;
        window.__heroProgress = Math.max(0, Math.min(window.scrollY / range, 1));
      };
      updateHeroProgress();
      window.addEventListener('scroll', updateHeroProgress, { passive:true });

      /* Live IST clock in the top-right HUD readout — real time, not a fake stat */
      var hudTime = document.getElementById('hudTime');
      if (hudTime){
        var fmt = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
        var tickClock = function(){ hudTime.textContent = fmt.format(new Date()); };
        tickClock();
        setInterval(tickClock, 1000);
      }

      /* Cursor-reactive parallax target for the 3D scene — normalized -1..1, only active with a real mouse */
      window.__heroMouseX = 0; window.__heroMouseY = 0;
      heroEl.addEventListener('mousemove', function(e){
        var r = heroEl.getBoundingClientRect();
        window.__heroMouseX = ((e.clientX - r.left) / r.width) * 2 - 1;
        window.__heroMouseY = ((e.clientY - r.top) / r.height) * 2 - 1;
      });
    }

    if (!prefersReduced){
      window.__heroIntroStarted = true;
      /* One-time entrance for the hero — HUD frame, then masked headline wipe, then the rest */
      if (heroEl){
        var heroTl = gsap.timeline({ delay: 0.1 });
        heroTl
          .to(heroEl.querySelectorAll('.hud-corner'), { opacity:0.5, scale:1, duration:0.6, ease:'power2.out', stagger:0.06 }, 0)
          .to(heroEl.querySelector('.eyebrow'), { y:0, opacity:1, duration:0.7, ease:'power2.out' }, 0.15)
          .to(heroEl.querySelectorAll('[data-headline-in]'), { y:'0%', duration:0.85, ease:'power3.out', stagger:0.12 }, 0.3)
          .to(heroEl.querySelectorAll('.hero-sub, .hero-support, .hero-actions'), { y:0, opacity:1, duration:0.7, ease:'power2.out', stagger:0.1 }, 0.75)
          .to(heroEl.querySelectorAll('.hud-readout'), { opacity:1, duration:0.6, ease:'power2.out', stagger:0.08 }, 1.0);
      }

      /* Generic section reveals — add data-reveal to any element on any page */
      gsap.utils.toArray('.section-head, .pillar, .service-card, .process-step, .work-card, .why-card, [data-reveal]').forEach(function(el){
        gsap.fromTo(el, { y: 26, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
      });
    }
  }
})();
