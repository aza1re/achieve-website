// Shared UI script: mobile menu toggle, smooth scroll, hover dropdown (desktop), tap-to-toggle (mobile)
(() => {
    const navUl = document.querySelector('nav ul');
    const mobileBtn = document.querySelector('.mobile-menu-btn');

    if (mobileBtn && navUl) {
        mobileBtn.addEventListener('click', function (e) {
            navUl.classList.toggle('show');
        });
    }

    // Close mobile menu when clicking on non-dropdown links
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', (e) => {
            const parentDrop = link.closest('.has-dropdown');
            // if this link is a dropdown trigger, do not close menu here (mobile handler handles it)
            if (parentDrop) return;
            if (navUl) navUl.classList.remove('show');
        });
    });

    // Smooth Scrolling for in-page anchors (ignores dropdown-toggle links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return;

            // let dropdown/toggle handlers handle their clicks
            if (this.closest('.has-dropdown')) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
                if (window.innerWidth <= 768 && navUl) navUl.classList.remove('show');
            }
        });
    });

    // Dropdown hover behavior (desktop): show on hover and keep visible while cursor is over trigger or panel
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

    // Mobile: tap-to-toggle dropdowns inside mobile nav
    (function attachDropdownTap() {
        // consider mobile when hover not available or small viewport
        const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth <= 768;
        if (!isMobile) return;

        document.querySelectorAll('.has-dropdown').forEach(item => {
            const trigger = item.querySelector(':scope > a');

            if (!trigger) return;

            trigger.addEventListener('click', function (e) {
                // Prevent immediate navigation so the tap toggles the submenu
                e.preventDefault();

                // close other open dropdowns
                document.querySelectorAll('.has-dropdown.open').forEach(open => {
                    if (open !== item) open.classList.remove('open');
                });

                item.classList.toggle('open');
            });
        });

        // close menus when tapping outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('nav')) {
                if (navUl) navUl.classList.remove('show');
                document.querySelectorAll('.has-dropdown.open').forEach(open => open.classList.remove('open'));
            }
        });
    })();

})();