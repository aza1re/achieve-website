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