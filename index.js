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
        // clear standalone All Year pill active state when a season is chosen
        document.querySelectorAll('.all-year-pill').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed','false');
          b.style.background = '';
          b.style.boxShadow = '';
        });
        // remove `all-year-active` from the allyear container so its glider collapses
        const allyearContainer = document.querySelector('.season-tabs.glass.allyear');
        if (allyearContainer) allyearContainer.classList.remove('all-year-active');

        // ensure the season glider is visible again (in case All Year hid it)
        const seasonGlider = document.querySelector('.season-tabs.glass .glass-glider');
        if (seasonGlider) {
          seasonGlider.style.opacity = 1;
        }
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

  // inject a glider into the standalone All Year row so it behaves like the seasons row
  (function ensureAllYearGlider() {
    const allyearContainer = document.querySelector('.season-tabs.glass.allyear');
    if (!allyearContainer) return;
    if (!allyearContainer.querySelector('.glass-glider')) {
      const g = document.createElement('div');
      g.className = 'glass-glider';
      allyearContainer.appendChild(g);
    }
  })();

  // Keep the All Year pill width in sync with the main season tabs
  function syncAllYearWidth() {
    const mainTabs = document.querySelector('.season-tabs:not(.allyear)');
    const allyearContainer = document.querySelector('.season-tabs.glass.allyear');
    const btn = document.querySelector('.all-year-pill');
    if (!mainTabs || !allyearContainer || !btn) return;
    // prefer matching the visual width of the seasons row, but constrain to the allyear container
    const target = Math.max(140, Math.min(mainTabs.clientWidth - 20, allyearContainer.clientWidth - 12));
    btn.style.minWidth = target + 'px';
    // update CSS variable used by the glider animation
    allyearContainer.style.setProperty('--allyear-width', `${btn.offsetWidth}px`);
  }
  // sync on load and when the viewport changes
  window.addEventListener('resize', syncAllYearWidth);
  document.addEventListener('DOMContentLoaded', syncAllYearWidth);

  // wire standalone All Year pill (below the seasons) to show the all-year group
  const allYearBtn = document.querySelector('.all-year-pill');
  if (allYearBtn) {
    allYearBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
        console.log('All Year pill clicked');
      // hide other season groups, show all-year
      groups.forEach(g => {
        if (g.dataset.season === 'all-year') g.removeAttribute('hidden');
        else g.setAttribute('hidden', '');
      });

      // clear active state from season labels
      document.querySelectorAll('.season-tabs .season-tab').forEach(l => { l.classList.remove('active'); l.setAttribute('aria-selected', 'false'); });

      // uncheck any season radio inputs so no season remains selected
      document.querySelectorAll('.season-tabs input[type="radio"]').forEach(r => { r.checked = false; });

      // hide the season row glider so it doesn't appear filled
      const seasonGlider = document.querySelector('.season-tabs.glass .glass-glider');
      if (seasonGlider) { seasonGlider.style.opacity = 0; }

      // set button active/pressed
      document.querySelectorAll('.all-year-pill').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      allYearBtn.classList.add('active');
      allYearBtn.setAttribute('aria-pressed','true');

      // animate the All Year glider: set CSS variable for width and add parent class
      const allyearContainer = document.querySelector('.season-tabs.glass.allyear');
      console.log('allyearContainer:', allyearContainer);
      if (allyearContainer) {
        // set a CSS variable so the CSS rule can size the glider to the pill width
        allyearContainer.style.setProperty('--allyear-width', `${allYearBtn.offsetWidth}px`);
        // position the glider at the right edge first so it can slide into center
        const g = allyearContainer.querySelector('.glass-glider');
        console.log('allyear glider element:', g);
        if (g) {
          // use transform-based starting state (matches season glider's GPU-friendly animation)
          g.style.transform = 'translateX(calc(100% - 6px)) scaleX(0)';
          g.style.opacity = '1';
          console.log('set starting styles on glider (transform-based):', { transform: g.style.transform, opacity: g.style.opacity });
        }
        // ensure the browser applies the starting position, then add the class on
        // the next animation frame so the transition animates left/width smoothly
        allyearContainer.classList.remove('all-year-active');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          allyearContainer.classList.add('all-year-active');
          console.log('added .all-year-active');
        }));
      }

      // Apply the same season palette to the All Year pill so it matches
      // the colored look used by the season tabs' glider.
      const palette = {
        spring: 'linear-gradient(90deg, #34d399, #8b5cf6)',
        summer: 'linear-gradient(90deg, #06b6d4, #f97316)',
        fall:   'linear-gradient(90deg, #fb923c, #ef4444)',
        winter: 'linear-gradient(90deg, #60a5fa, #7c3aed)'
      };
      // Force All Year pill to use the Summer palette for a consistent look
      const bg = palette.summer;
      allYearBtn.style.background = bg;
      allYearBtn.style.boxShadow = '0 8px 26px rgba(0,0,0,0.45)';

      // scroll into view the programs section for context
      const programsSection = document.getElementById('programs');
      if (programsSection) programsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
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
