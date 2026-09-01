document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const panels = [...document.querySelectorAll('.panel, .survey-gateway')];
const status = document.querySelector('.interaction-status');

const announce = (message) => {
  if (status) status.textContent = message;
};

if (reducedMotion || !('IntersectionObserver' in window)) {
  panels.forEach((panel) => panel.classList.add('is-visible'));
} else {
  panels.forEach((panel) => panel.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  panels.forEach((panel) => revealObserver.observe(panel));
}

const navLinks = [...document.querySelectorAll('.nav-links a')];
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

if ('IntersectionObserver' in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const current = entries.find((entry) => entry.isIntersecting);
    if (!current) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current.target.id}`;
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -68% 0px' });
  observedSections.forEach((section) => navigationObserver.observe(section));
}

const formShell = document.querySelector('#survey-form');
const formToggle = document.querySelector('.embed-button');
const formClose = document.querySelector('.close-form');
const surveyFrame = formShell?.querySelector('iframe');

const setFormOpen = (open) => {
  if (!formShell || !formToggle) return;
  if (open && surveyFrame && !surveyFrame.src) surveyFrame.src = surveyFrame.dataset.src;
  formShell.hidden = !open;
  formToggle.setAttribute('aria-expanded', String(open));
  formToggle.textContent = open ? 'Hide Embedded Form' : 'Complete Here';
  announce(open ? 'Embedded study questionnaire opened.' : 'Embedded study questionnaire closed.');
  if (open) {
    formShell.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  } else {
    document.querySelector('#participate')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
};

formToggle?.addEventListener('click', () => setFormOpen(formShell?.hidden ?? true));
formClose?.addEventListener('click', () => setFormOpen(false));

const viewButtons = [...document.querySelectorAll('[data-view]')];
viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const significantOnly = button.dataset.view === 'significant';
    document.body.classList.toggle('significant-focus', significantOnly);
    viewButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    announce(significantOnly ? 'Significant finding focus enabled.' : 'All evidence is visible.');
    if (significantOnly) {
      document.querySelector('#key-finding')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      });
    }
  });
});

document.querySelectorAll('.domain-list article').forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');

  const selectCard = () => {
    const selected = !card.classList.contains('is-selected');
    document.querySelectorAll('.domain-list article').forEach((item) => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    card.classList.toggle('is-selected', selected);
    card.setAttribute('aria-pressed', String(selected));
    const domainName = card.querySelector('strong')?.textContent || 'Domain';
    announce(selected ? `${domainName} selected.` : 'Domain selection cleared.');
  };

  card.addEventListener('click', selectCard);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectCard();
  });
});

document.querySelectorAll('.bar-row').forEach((row) => {
  const label = row.querySelector('.bar-label span')?.textContent;
  const mean = row.querySelector(':scope > strong')?.textContent;
  const deviation = row.querySelector(':scope > small')?.textContent;
  row.tabIndex = 0;
  row.title = `${label}: Mean ${mean}, ${deviation}`;
  row.setAttribute('aria-label', `${label}, mean ${mean}, ${deviation}`);
});

const backToTop = document.querySelector('.back-to-top');
const updateBackToTop = () => backToTop?.classList.toggle('visible', window.scrollY > 450);
window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();
backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.body.classList.remove('significant-focus');
  viewButtons.forEach((button) => {
    const selected = button.dataset.view === 'all';
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('.domain-list article').forEach((card) => {
    card.classList.remove('is-selected');
    card.setAttribute('aria-pressed', 'false');
  });
  announce('Interactive focus cleared.');
});
