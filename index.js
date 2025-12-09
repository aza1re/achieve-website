class ProgramsCarousel {
            constructor() {
                this.cards = document.querySelectorAll('.program-card');
                this.dots = document.querySelectorAll('.nav-dot');
                this.currentIndex = 0;
                this.totalCards = this.cards.length;
                
                this.init();
            }

            init() {
                // Add click events to dots
                this.dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        this.setActiveCard(index);
                    });
                });

                // Add click events to cards
                this.cards.forEach((card, index) => {
                    card.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('program-btn')) {
                            this.setActiveCard(index);
                        }
                    });
                });

                // Add swipe support for mobile
                this.addSwipeSupport();
            }

            setActiveCard(index) {
                this.currentIndex = index;
                
                // Update cards
                this.cards.forEach((card, i) => {
                    card.classList.remove('active', 'left', 'right', 'far-left', 'far-right');
                    
                    if (i === index) {
                        card.classList.add('active');
                    } else if (i === (index - 1 + this.totalCards) % this.totalCards) {
                        card.classList.add('left');
                    } else if (i === (index + 1) % this.totalCards) {
                        card.classList.add('right');
                    } else if (i === (index - 2 + this.totalCards) % this.totalCards) {
                        card.classList.add('far-left');
                    } else if (i === (index + 2) % this.totalCards) {
                        card.classList.add('far-right');
                    }
                });

                // Update dots
                this.dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }

            addSwipeSupport() {
                let startX = 0;
                let endX = 0;

                this.cards[0].parentElement.addEventListener('touchstart', (e) => {
                    startX = e.changedTouches[0].screenX;
                });

                this.cards[0].parentElement.addEventListener('touchend', (e) => {
                    endX = e.changedTouches[0].screenX;
                    this.handleSwipe(startX, endX);
                });
            }

            handleSwipe(startX, endX) {
                const swipeThreshold = 50;
                const diff = startX - endX;

                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                        // Swipe left - next card
                        this.setActiveCard((this.currentIndex + 1) % this.totalCards);
                    } else {
                        // Swipe right - previous card
                        this.setActiveCard((this.currentIndex - 1 + this.totalCards) % this.totalCards);
                    }
                }
            }
        }

        // Initialize the carousel when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new ProgramsCarousel();
        });
        // Mobile Menu Toggle
        document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
            document.querySelector('nav ul').classList.toggle('show');
        });
        // Reset animation on page load for smoother effect
window.addEventListener('load', function() {
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.animation = 'none';
    setTimeout(() => {
        heroContent.style.animation = '';
    }, 10);
});
        // Smooth Scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu after clicking a link
                    if(window.innerWidth <= 768) {
                        document.querySelector('nav ul').classList.remove('show');
                    }
                }
            });
        });

        // Dropdown hover behavior with small hide delay so it stays when cursor moves between trigger and panel
        (function attachDropdownHover() {
            // only enable on devices with hover capability
            if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

            const DROPDOWN_SELECTOR = '.has-dropdown';
            document.querySelectorAll(DROPDOWN_SELECTOR).forEach(item => {
                let hideTimer = null;
                const dropdown = item.querySelector('.dropdown');

                const show = () => {
                    clearTimeout(hideTimer);
                    item.classList.add('open');
                };

                const hide = () => {
                    clearTimeout(hideTimer);
                    hideTimer = setTimeout(() => item.classList.remove('open'), 220);
                };

                item.addEventListener('mouseenter', show);
                item.addEventListener('mouseleave', hide);

                if (dropdown) {
                    dropdown.addEventListener('mouseenter', show);
                    dropdown.addEventListener('mouseleave', hide);
                }
            });
        })();

document.addEventListener('DOMContentLoaded', function () {
  const tabsContainer = document.querySelector('.season-tabs');
  const groups = document.querySelectorAll('.season-cards');
  if (!tabsContainer) return;

  // determine season string
  function getCurrentSeason() {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
  }

  // Move current season tab (and its radio input if present) to be first in DOM
  function makeCurrentTabFirst(season) {
    const label = tabsContainer.querySelector(`.season-tab[data-season="${season}"]`);
    if (!label) return;
    // if there's a radio input directly associated (id like glass-<season>), move it too
    const radio = document.getElementById(`glass-${season}`);
    // prepend radio then label (radio before label keeps CSS selectors stable)
    if (radio) tabsContainer.prepend(radio);
    tabsContainer.prepend(label);
  }

  // build labels list and glider ref AFTER any reordering
  function initTabs() {
    const labels = Array.from(tabsContainer.querySelectorAll('.season-tab'));
    const glider = tabsContainer.querySelector('.glass-glider');

    function setGlider(index) {
      if (!glider) return;
      const count = Math.max(1, labels.length);
      glider.style.width = `${100 / count}%`;
      glider.style.transform = `translateX(${index * 100}%)`;
    }

    function setGliderColor(season) {
      if (!glider) return;
      const map = {
        spring: 'linear-gradient(90deg, #34d399, #8b5cf6)',
        summer: 'linear-gradient(90deg, #06b6d4, #f97316)',
        fall:   'linear-gradient(90deg, #fb923c, #ef4444)',
        winter: 'linear-gradient(90deg, #60a5fa, #7c3aed)'
      };
      glider.style.background = map[season] || 'linear-gradient(90deg,#8C2131,#7b2a45)';
      glider.style.boxShadow = '0 8px 26px rgba(0,0,0,0.45)';
    }

    function scrollLabelToLeft(label) {
      if (!tabsContainer || !label) return;
      const offset = label.offsetLeft - (tabsContainer.clientLeft || 0) - 8;
      tabsContainer.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }

    function activateSeason(season, index = null) {
      const idx = index !== null ? index : labels.findIndex(l => l.dataset.season === season);
      labels.forEach((l, i) => {
        const is = l.dataset.season === season;
        l.classList.toggle('active', is);
        l.setAttribute('aria-selected', is ? 'true' : 'false');
      });
      groups.forEach(g => {
        if (g.dataset.season === season) g.removeAttribute('hidden');
        else g.setAttribute('hidden', '');
      });
      setGlider(Math.max(0, idx));
      setGliderColor(season);
      const activeLabel = labels[Math.max(0, idx)] || labels[0];
      scrollLabelToLeft(activeLabel);
    }

    // attach click handlers (rebuild ensures no duplicate listeners)
    labels.forEach((label, i) => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        activateSeason(label.dataset.season, i);
      });
    });

    // default activation
    const current = getCurrentSeason();
    const initialIndex = labels.findIndex(l => l.dataset.season === current);
    activateSeason(current, initialIndex >= 0 ? initialIndex : 0);

    // intersection observer to scroll active into leftmost view when section appears
    const programsSection = document.getElementById('programs');
    if (programsSection && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const active = labels.find(l => l.classList.contains('active')) || labels[0];
            scrollLabelToLeft(active);
          }
        });
      }, { threshold: 0.15 });
      io.observe(programsSection);
    }
  }

  // reorder DOM first then init tabs (safe, predictable)
  const current = getCurrentSeason();
  makeCurrentTabFirst(current);
  initTabs();
});

// Ensure stacking by toggling a helper class when viewport <= breakpoint
(function () {
  const breakpoint = 1366; // increased breakpoint
  function updateStack() {
    const shouldStack = window.innerWidth <= breakpoint;
    document.querySelectorAll('.cards-row').forEach(row => {
      row.classList.toggle('stack-vertical', shouldStack);
    });
  }
  window.addEventListener('resize', updateStack);
  document.addEventListener('DOMContentLoaded', updateStack);
  if (document.readyState === 'complete' || document.readyState === 'interactive') updateStack();
})();

// Card expand / in-place "details page" behaviour
(function cardExpandHandler() {
  const rows = document.querySelectorAll('.cards-row');

  rows.forEach(row => {
    row.addEventListener('click', (ev) => {
      const card = ev.target.closest('.card');
      if (!card) return;

      // prevent anchor default navigation and treat it as expand toggle
      const anchor = ev.target.closest('a.card-learn');
      if (anchor) {
        ev.preventDefault();
      }

      // toggle expansion for clicked card
      const already = card.classList.contains('expanded');
      // collapse all cards in this row first
      row.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
      if (!already) {
        card.classList.add('expanded');
        row.classList.add('has-expanded');
      } else {
        row.classList.remove('has-expanded');
      }

      // stop the click from bubbling to document (which collapses)
      ev.stopPropagation();
    });

    // make close button inside details work (delegated)
    row.addEventListener('click', (ev) => {
      if (ev.target.matches('.card-details .close-card')) {
        const card = ev.target.closest('.card');
        if (card) {
          card.classList.remove('expanded');
          row.classList.remove('has-expanded');
        }
      }
    });
  });

  // click/tap outside a card collapses any expanded view
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.card')) {
      document.querySelectorAll('.cards-row.has-expanded').forEach(r => {
        r.classList.remove('has-expanded');
        r.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
      });
    }
  });

  // Escape key closes expanded state
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document.querySelectorAll('.cards-row.has-expanded').forEach(r => {
        r.classList.remove('has-expanded');
        r.querySelectorAll('.card.expanded').forEach(c => c.classList.remove('expanded'));
      });
    }
  });
})();