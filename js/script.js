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
        });