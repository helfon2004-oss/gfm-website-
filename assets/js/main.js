(function(){
  const overlay = document.getElementById('overlay');
  const nav     = document.getElementById('main-nav');
  const revealElements = document.querySelectorAll('.reveal-up');

  // ── Video Carousel ───────────────────────────────────────────────────
  // Agrega aquí los nombres de tus videos en assets/videos/
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  var videoPrefix = isMobile ? 'assets/videos/mobile/' : 'assets/videos/';
  const VIDEO_LIST = [
    videoPrefix + 'hero1.mp4',
    videoPrefix + 'hero2.mp4',
    videoPrefix + 'hero3.mp4',
    videoPrefix + 'hero4.mp4',
    videoPrefix + 'hero5.mp4',
  ];

  const videoA   = document.getElementById('videoA');
  const videoB   = document.getElementById('videoB');
  const videoBg  = document.getElementById('videoBg');

  // Filtra solo los videos que existen haciendo un HEAD request
  function checkVideos(list, callback) {
    var valid = [];
    var checked = 0;
    if (!list.length) { callback([]); return; }
    list.forEach(function(src) {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', src, true);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) valid.push(src);
        checked++;
        if (checked === list.length) callback(valid);
      };
      xhr.onerror = function() {
        checked++;
        if (checked === list.length) callback(valid);
      };
      xhr.send();
    });
  }

  checkVideos(VIDEO_LIST, function(validVideos) {
    if (!validVideos.length) {
      // No hay videos — usar fondo animado de fallback
      videoBg.classList.add('no-video');
      return;
    }

    var current = 0;
    var activeVideo  = videoA;
    var standbyVideo = videoB;

    function playVideo(idx) {
      var src = validVideos[idx % validVideos.length];
      activeVideo.muted = true;
      if (!(activeVideo.src && activeVideo.src.endsWith(src))) {
        activeVideo.src = src;
      }
      var p = activeVideo.play();
      if (p !== undefined) p.catch(function(){});

      // Precargar el siguiente en standby
      var nextSrc = validVideos[(idx + 1) % validVideos.length];
      standbyVideo.src = nextSrc;
      standbyVideo.load();
    }

    function switchVideo() {
      clearTimeout(switchTimer);
      current = (current + 1) % validVideos.length;
      updateDots();

      // El standby ya tiene el siguiente video cargado — hazlo visible
      standbyVideo.style.opacity = '1';
      standbyVideo.style.zIndex  = '2';
      activeVideo.style.opacity  = '0';
      activeVideo.style.zIndex   = '1';

      standbyVideo.play().catch(function(){});

      // Swap roles
      var tmp    = activeVideo;
      activeVideo  = standbyVideo;
      standbyVideo = tmp;

      // Precarga el siguiente
      var nextSrc = validVideos[(current + 1) % validVideos.length];
      standbyVideo.src = nextSrc;
      standbyVideo.load();
    }

    const MAX_DURATION = 12000; // 12 segundos máximo por video
    var switchTimer = null;

    function scheduleSwich() {
      clearTimeout(switchTimer);
      switchTimer = setTimeout(switchVideo, MAX_DURATION);
    }

    // Cambiar cuando termina el video O cuando pasan 12 segundos
    videoA.addEventListener('ended', switchVideo);
    videoB.addEventListener('ended', switchVideo);
    videoA.addEventListener('play', scheduleSwich);
    videoB.addEventListener('play', scheduleSwich);

    // Crear dots
    var dotsContainer = document.getElementById('videoDots');
    var dots = [];
    if (dotsContainer) {
      validVideos.forEach(function(_, i) {
        var dot = document.createElement('button');
        dot.className = 'video-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Video ' + (i+1));
        dot.addEventListener('click', function() {
          clearTimeout(switchTimer);
          current = i - 1;
          switchVideo();
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function updateDots() {
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === current % validVideos.length);
      });
    }

    // Iniciar
    playVideo(0);
  });


  // ── Unified scroll handler ───────────────────────────────────────────
  let scrollTicking = false;
  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(handleScroll);
    }
  }, { passive: true });

  function handleScroll() {
    scrollTicking = false;
    var scrollY = window.scrollY;

    // Hero fade out
    if (overlay) {
      var opacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.6));
      overlay.style.opacity = opacity;
      overlay.style.pointerEvents = opacity < 0.05 ? 'none' : '';
    }

    // Sticky nav
    if (nav) nav.classList.toggle('scrolled', scrollY > 50);

    // Scroll reveal
    checkReveal();
  }


  // ── Scroll Reveal ────────────────────────────────────────────────────
  function checkReveal() {
    var triggerBottom = window.innerHeight * 0.88;
    revealElements.forEach(function(box) {
      if (!box.classList.contains('active') && box.getBoundingClientRect().top < triggerBottom) {
        box.classList.add('active');
      }
    });
  }

  // Initial check on load
  checkReveal();

  // ── Contadores animados ──────────────────────────────────────────────
  var counters = document.querySelectorAll('.credential-icon[data-target]');
  var countersDone = false;

  function animateCounters() {
    if (countersDone) return;
    var first = document.querySelector('.credential-icon[data-target]');
    if (!first) return;
    var rect = first.getBoundingClientRect();
    if (rect.top > window.innerHeight) return;
    countersDone = true;
    counters.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var duration = 1800;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.floor(ease * target).toLocaleString('es-MX') + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toLocaleString('es-MX') + suffix;
      }
      requestAnimationFrame(step);
    });
  }

  window.addEventListener('scroll', animateCounters, { passive: true });
  animateCounters();

  // ── Formulario de contacto ───────────────────────────────────────────
  var contactForm = document.getElementById('contactForm');
  var submitBtn   = document.getElementById('submitBtn');
  var formMsg     = document.getElementById('formMsg');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      submitBtn.textContent = 'Enviando...';
      submitBtn.disabled = true;

      var data = new FormData(contactForm);
      fetch(contactForm.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function(res) {
        if (res.ok) {
          formMsg.textContent = '✓ Mensaje enviado. Te contactaremos pronto.';
          formMsg.style.color = '#4caf50';
          formMsg.style.display = 'block';
          contactForm.reset();
          submitBtn.textContent = 'Enviar Solicitud';
          submitBtn.disabled = false;
        } else {
          throw new Error();
        }
      }).catch(function() {
        formMsg.textContent = 'Hubo un error. Escríbenos directo a ihp@ferreteromarti.com';
        formMsg.style.color = '#ff6b35';
        formMsg.style.display = 'block';
        submitBtn.textContent = 'Enviar Solicitud';
        submitBtn.disabled = false;
      });
    });
  }

  // ── Hamburger Menu ───────────────────────────────────────────────────
  var menuBtn    = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function() {
      menuBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Cerrar al dar click en un link
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menuBtn.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

})();
