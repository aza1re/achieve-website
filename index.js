class ProgramsCarousel {
            constructor() {
                this.cards = document.querySelectorAll('.program-card');
                this.dots = document.querySelectorAll('.nav-dot');
                this.currentIndex = 0;
                this.totalCards = this.cards.length;
                
                this.init();
            }

            init() {
              if (!this.cards.length) return;

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
              if (!this.cards.length || !this.cards[0].parentElement) return;

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
  if (!heroContent) return;
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

        // Event search by title (filters all event cards)
        (function initEventSearch() {
          const searchInput = document.querySelector('.nav-search input[type="search"]');
          const searchButton = document.querySelector('.nav-search button');
          const eventCards = Array.from(document.querySelectorAll('.event-card'));
          const seasonGroups = Array.from(document.querySelectorAll('.season-cards'));
          const seasonTabs = Array.from(document.querySelectorAll('.season-tab'));

          if (!searchInput || !eventCards.length) return;

          function applyFilter() {
            const query = (searchInput.value || '').trim().toLowerCase();

            if (!query) {
              eventCards.forEach((card) => {
                card.style.display = '';
                card.hidden = false;
              });

              // Restore season visibility using currently active tab state.
              const activeTab = seasonTabs.find((tab) => tab.classList.contains('active'));
              if (activeTab) activeTab.click();
              return;
            }

            // While searching, expose all seasonal groups so results are not constrained to one tab.
            seasonGroups.forEach((group) => group.removeAttribute('hidden'));

            eventCards.forEach((card) => {
              const title = (card.querySelector('h3')?.textContent || '').trim().toLowerCase();
              const isMatch = title.includes(query);
              card.hidden = !isMatch;
              card.style.display = isMatch ? '' : 'none';
            });
          }

          searchInput.addEventListener('input', applyFilter);

          if (searchButton) {
            searchButton.addEventListener('click', applyFilter);
          }

          searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyFilter();
            }
          });
        })();

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

  function getCurrentSeason() {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
  }

  function makeCurrentTabFirst(season) {
    const label = tabsContainer.querySelector(`.season-tab[data-season="${season}"]`);
    if (!label) return;
    const radio = document.getElementById(`glass-${season}`);
    if (radio) tabsContainer.prepend(radio);
    tabsContainer.prepend(label);
  }

  function initTabs() {
    const labels = Array.from(tabsContainer.querySelectorAll('.season-tab'));
    const glider = tabsContainer.querySelector('.glass-glider');

    function setGliderToLabel(label) {
      if (!glider || !label) return;
      const left = label.offsetLeft - 8; // account for glass padding
      glider.style.width = `${label.offsetWidth}px`;
      glider.style.transform = `translateX(${left}px)`;
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

    function activateSeason(season) {
      labels.forEach((l) => {
        const is = l.dataset.season === season;
        l.classList.toggle('active', is);
        l.setAttribute('aria-selected', is ? 'true' : 'false');
      });

      const radio = document.getElementById(`glass-${season}`);
      if (radio) radio.checked = true;

      groups.forEach(g => {
        if (g.dataset.season === season) g.removeAttribute('hidden');
        else g.setAttribute('hidden', '');
      });

      const activeLabel = labels.find(l => l.dataset.season === season) || labels[0];
      setGliderToLabel(activeLabel);
      setGliderColor(season);
      scrollLabelToLeft(activeLabel);
    }

    labels.forEach((label) => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        activateSeason(label.dataset.season);
      });
    });

    const current = getCurrentSeason();
    activateSeason(current);

    window.addEventListener('resize', () => {
      const activeLabel = labels.find(l => l.classList.contains('active')) || labels[0];
      setGliderToLabel(activeLabel);
    });
  }

  const current = getCurrentSeason();
  makeCurrentTabFirst(current);
  initTabs();

  const programsSection = document.getElementById('programs');
  if (programsSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const labels = Array.from(tabsContainer.querySelectorAll('.season-tab'));
          const active = labels.find(l => l.classList.contains('active')) || labels[0];
          const offset = active.offsetLeft - (tabsContainer.clientLeft || 0) - 8;
          tabsContainer.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
        }
      });
    }, { threshold: 0.15 });
    io.observe(programsSection);
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

      // Let event cards open the modal instead of expanding
      if (card.classList.contains('event-card')) return;

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

(function initHeroCarousel() {
  const carousel = document.querySelector(".hero-carousel");
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(document.querySelectorAll(".carousel-slide"));
  const dotsContainer = document.querySelector(".carousel-dots");

  if (!carousel || !track || slides.length === 0) return;

  // Build dots if missing or count mismatched
  let dots = [];
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to banner ${i + 1}`);
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      if (i === 0) dot.classList.add("active");
      dotsContainer.appendChild(dot);
    });
    dots = Array.from(dotsContainer.querySelectorAll(".dot"));
  }

  let currentIndex = 0;
  let autoTimer = null;
  let startX = 0;
  let isDragging = false;

  const updateCarousel = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
      dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
    });
  };

  const startAuto = () => {
    stopAuto();
    if (slides.length > 1) {
      autoTimer = setInterval(() => updateCarousel(currentIndex + 1), 5000);
    }
  };

  const stopAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      updateCarousel(i);
      startAuto();
    });
  });

  carousel.addEventListener("pointerdown", (e) => {
    if (slides.length <= 1) return;
    isDragging = true;
    startX = e.clientX;
    stopAuto();
  });

  carousel.addEventListener("pointerup", (e) => {
    if (!isDragging || slides.length <= 1) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 40) {
      updateCarousel(diff < 0 ? currentIndex + 1 : currentIndex - 1);
    }
    isDragging = false;
    startAuto();
  });

  carousel.addEventListener("pointerleave", () => {
    isDragging = false;
  });

  // Pause on hover (desktop)
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);

  updateCarousel(0);
  startAuto();
})();

(function initEventModal() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;

  const DEFAULT_CAMP_SIGNUP_URL = "./camps/index.html";
  const NOTRE_DAME_BANNER = "sources/homepage/1.png";
  const CAMP_INFO = {
    "Student-athlete School Tours": {
      price: "$1,200 CAD",
      venue: "Toronto, Ontario",
      features: [
        { title: "Academic Pathway Planning", desc: "Visits and orientation focused on student-athlete school options." },
        { title: "Campus + Ice Exposure", desc: "Players tour facilities and see real training environments." },
        { title: "Family Guidance", desc: "Structured support to help families compare fit and next steps." },
      ],
    },
    "Junior Hockey": {
      price: "$2,100 CAD",
      venue: "Montreal, Quebec",
      features: [
        { title: "High Tempo Sessions", desc: "Skill and pace-focused training built for junior-level progression." },
        { title: "Position-Specific Work", desc: "Dedicated reps for forwards, defensemen, and goalies." },
        { title: "Performance Feedback", desc: "Coaches provide direct notes to target each player's development." },
      ],
    },
    "Notre Dame Hounds @Incheon, Korea": {
      price: "$2,950 CAD",
      venue: "Incheon Seonhak Int'l Ice Rink",
      features: [
        { title: "International Competition", desc: "Compete against elite teams in a high-standard tournament setting." },
        { title: "Coach-Led Clinics", desc: "On-ice sessions designed around in-game decision making and execution." },
        { title: "Travel Logistics Included", desc: "Clear itinerary and operations support for players and families." },
      ],
    },
    "Notre Dame Hounds @Thailand": {
      price: "$2,450 CAD",
      venue: "Bangkok, Thailand",
      features: [
        { title: "Tournament Readiness", desc: "Structured prep sessions before and during event play." },
        { title: "Game Film Touchpoints", desc: "Quick video reviews for tactical adjustments." },
        { title: "Team Culture Build", desc: "Focused environment that strengthens accountability and cohesion." },
      ],
    },
    "Bauer Cup": {
      price: "$2,600 CAD",
      venue: "Seoul, Korea",
      features: [
        { title: "Elite Showcase", desc: "Competitive stage for players targeting higher-level opportunities." },
        { title: "Skill Transfer Drills", desc: "Practice design emphasizes skills that carry directly into games." },
        { title: "Mentor Coaching", desc: "Direct guidance from experienced staff throughout the event." },
      ],
    },
    "Quebec Peewee": {
      price: "$1,950 CAD",
      venue: "Quebec City, Canada",
      features: [
        { title: "Premier Youth Event", desc: "Participate in one of hockey's most recognized youth tournaments." },
        { title: "Game Environment Prep", desc: "Sessions tuned for tournament pace and pressure." },
        { title: "Travel Coordination", desc: "Operational details are organized for a smoother camp experience." },
      ],
    },
    "Pre-Quebec": {
      price: "$1,500 CAD",
      venue: "Rockland, Ontario",
      features: [
        { title: "Pre-Tournament Build", desc: "Final prep cycle before major competition windows." },
        { title: "Systems Alignment", desc: "Team structure and role clarity work before game travel." },
        { title: "Confidence Sessions", desc: "Targeted reps to sharpen execution under pressure." },
      ],
    },
  };

  const FALLBACK_INFO = {
    price: "$TBD",
    venue: "Venue shared after registration",
    features: [
      { title: "International Coaching", desc: "Professional on-ice guidance tailored to player level." },
      { title: "Structured Development", desc: "Clear training progression with practical game focus." },
      { title: "Player Support", desc: "Organized communication and planning for participants and families." },
    ],
  };

  const backdrop = modal.querySelector("[data-close]");
  const closeBtn = modal.querySelector(".event-modal__close");
  const modalImage = modal.querySelector(".event-modal__image");
  const modalTitle = modal.querySelector(".event-modal__title");
  const modalDetails = modal.querySelector(".event-modal__details");
  const modalRegister = modal.querySelector(".event-modal__register");
  const modalPrice = modal.querySelector("[data-event-price]");
  const modalDetailLines = modal.querySelector("[data-event-detail-lines]");
  const modalVenueLine = modal.querySelector("[data-event-venue-line] span");
  const modalDatesLine = modal.querySelector("[data-event-dates-line] span");
  const modalFeatures = modal.querySelector("[data-event-features]");
  let activeRegisterHref = DEFAULT_CAMP_SIGNUP_URL;

  const bindFeatureInteractions = () => {
    if (!modalFeatures) return;
    const items = Array.from(modalFeatures.querySelectorAll(".event-modal__feature"));

    const activate = (item) => {
      items.forEach((el) => el.classList.remove("is-active"));
      item.classList.add("is-active");
    };

    items.forEach((item, idx) => {
      if (!item.dataset.boundFeature) {
        item.dataset.boundFeature = "1";
        item.addEventListener("mouseenter", () => activate(item));
        item.addEventListener("click", () => activate(item));
        item.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate(item);
          }
        });
      }

      if (idx === 0) item.classList.add("is-active");
      else item.classList.remove("is-active");
    });
  };

  const openModal = (card) => {
    const title = card.querySelector("h3");
    const desc = card.querySelector("p");

    const detailsText = card.getAttribute("data-details") || (desc ? desc.textContent : "");
    const rawRegisterHref = card.getAttribute("data-register");

    const baseHref =
      rawRegisterHref && rawRegisterHref !== "#"
        ? rawRegisterHref
        : DEFAULT_CAMP_SIGNUP_URL;

    const campName = (title?.textContent || "Camp").trim();
    const campId = (card.getAttribute("data-camp-id") || "").trim();
    const info = CAMP_INFO[campName] || FALLBACK_INFO;
    const isNotreDameEvent = campName.startsWith("Notre Dame Hounds @");
    const hideIncheonHeaderInfo = campName === "Notre Dame Hounds @Incheon, Korea";

    const url = new URL(baseHref, window.location.href);
    url.searchParams.set("camp", campName);
    if (campId) url.searchParams.set("campId", campId);
    activeRegisterHref = url.toString();

    modalTitle.textContent = title ? title.textContent : "Event Details";
    modalTitle.hidden = hideIncheonHeaderInfo;
    if (modalImage) {
      const fallbackImage = card.querySelector("img")?.getAttribute("src") || "";
      const posterSrc = isNotreDameEvent ? NOTRE_DAME_BANNER : fallbackImage;
      modalImage.src = posterSrc;
      modalImage.alt = `${campName} poster`;
    }
    if (modalRegister) modalRegister.setAttribute("href", activeRegisterHref);
    if (modalPrice) modalPrice.textContent = info.price;

    const venueMatch = detailsText.match(/Venue:\s*([^\.]+)\.?/i);
    const datesMatch = detailsText.match(/Dates?:\s*([^\.]+)\.?/i);
    const venueText = venueMatch ? venueMatch[1].trim() : (info.venue || "");
    const datesText = datesMatch ? datesMatch[1].trim() : "";

    if (modalDetailLines && modalVenueLine && modalDatesLine) {
      if (hideIncheonHeaderInfo) {
        modalDetailLines.hidden = true;
      } else if (venueText || datesText) {
        modalDetailLines.hidden = false;
        modalVenueLine.textContent = venueText || "Venue shared on registration";
        modalDatesLine.textContent = datesText || "Dates shared on registration";
      } else {
        modalDetailLines.hidden = true;
      }
    }

    if (modalDetails) {
      const hasStructuredDetails = Boolean(venueMatch || datesMatch);
      modalDetails.hidden = hasStructuredDetails;
      modalDetails.textContent = hasStructuredDetails ? "" : detailsText;
    }

    if (modalFeatures) {
      const items = (info.features && info.features.length ? info.features : FALLBACK_INFO.features).slice(0, 3);
      modalFeatures.innerHTML = items
        .map(
          (feature) =>
            `<li class="event-modal__feature" tabindex="0"><strong class="event-modal__feature-title">${feature.title}</strong><span class="event-modal__feature-desc">${feature.desc}</span></li>`
        )
        .join("");
      bindFeatureInteractions();
    }

    modal.classList.remove("feature-anim-ready");
    void modal.offsetWidth;
    modal.classList.add("feature-anim-ready");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  // Click anywhere on the card opens modal
  document.addEventListener("click", (e) => {
    if (e.target.closest("#event-modal")) return;

    const card = e.target.closest(".event-card");
    if (!card) return;

    e.preventDefault();
    openModal(card);
  });

  // Keyboard accessibility (Enter/Space)
  document.addEventListener("keydown", (e) => {
    const card = document.activeElement?.closest?.(".event-card");
    if (!card) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(card);
    }
  });

  if (modalRegister) {
    modalRegister.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(activeRegisterHref || DEFAULT_CAMP_SIGNUP_URL);
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
})();

