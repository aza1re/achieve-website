    // Mobile Menu Toggle
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        document.querySelector('nav ul').classList.toggle('show');
    });

    // Close mobile menu when clicking on links
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('nav ul').classList.remove('show');
        });
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

            // Dropdown hover behavior: show on hover and keep visible while cursor is over the trigger or panel
            (function attachDropdownHover() {
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
        });