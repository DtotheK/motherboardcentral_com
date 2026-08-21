/* ============================================================
   MotherboardCentral.com - Main JavaScript
   Vanilla JS | No frameworks | ES6+
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // 1. NAVBAR
    // --------------------------------------------------------

    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Add 'scrolled' class when page is scrolled past 50px
    const handleNavbarScroll = () => {
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll(); // run on load in case page is already scrolled

    // Mobile menu toggle
    navToggle?.addEventListener('click', () => {
        navLinks?.classList.toggle('open');
    });

    // Close mobile menu when clicking a nav link
    navLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });

    // Set 'active' class on the nav link matching the current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks?.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const linkPage = href.split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });


    // --------------------------------------------------------
    // 2. SCROLL ANIMATIONS (IntersectionObserver)
    // --------------------------------------------------------

    const fadeElements = document.querySelectorAll('.fade-in');

    if (fadeElements.length > 0) {
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        fadeElements.forEach(el => fadeObserver.observe(el));
    }


    // --------------------------------------------------------
    // 3. BACK TO TOP BUTTON
    // --------------------------------------------------------

    const backToTopBtn = document.querySelector('.back-to-top');

    const handleBackToTopVisibility = () => {
        if (!backToTopBtn) return;
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', handleBackToTopVisibility);
    handleBackToTopVisibility(); // run on load

    backToTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // --------------------------------------------------------
    // 4. GLOBAL SEARCH (Navbar Search)
    // --------------------------------------------------------

    const searchIndex = [
        // Reviews - 70 Motherboards
        {
            title: "ASUS ROG Maximus Z790 Hero Review",
            type: "Review",
            url: "review-asus-rog-maximus-z790-hero.html",
            description: "ASUS ROG Maximus Z790 Hero - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MAG B760 Tomahawk WiFi Review",
            type: "Review",
            url: "review-msi-mag-b760-tomahawk-wifi.html",
            description: "MSI MAG B760 Tomahawk WiFi - LGA 1700 B760 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE B650 AORUS Elite AX Review",
            type: "Review",
            url: "review-gigabyte-b650-aorus-elite-ax.html",
            description: "GIGABYTE B650 AORUS Elite AX - AM5 B650 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix X670E-E Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-x670e-e-gaming-wifi.html",
            description: "ASUS ROG Strix X670E-E Gaming WiFi - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming B760-PLUS WiFi D4 Review",
            type: "Review",
            url: "review-asus-tuf-gaming-b760-plus-wifi-d4.html",
            description: "ASUS TUF Gaming B760-PLUS WiFi D4 - LGA 1700 B760 ATX DDR4 motherboard review"
        },
        {
            title: "ASRock B760M Pro RS/D4 Review",
            type: "Review",
            url: "review-asrock-b760m-pro-rs-d4.html",
            description: "ASRock B760M Pro RS/D4 - LGA 1700 B760 Micro-ATX DDR4 motherboard review"
        },
        {
            title: "MSI PRO B650-P WiFi Review",
            type: "Review",
            url: "review-msi-pro-b650-p-wifi.html",
            description: "MSI PRO B650-P WiFi - AM5 B650 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE X670E AORUS Master Review",
            type: "Review",
            url: "review-gigabyte-x670e-aorus-master.html",
            description: "GIGABYTE X670E AORUS Master - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix Z790-E Gaming WiFi II Review",
            type: "Review",
            url: "review-asus-rog-strix-z790-e-gaming-wifi-ii.html",
            description: "ASUS ROG Strix Z790-E Gaming WiFi II - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix Z790-A Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-z790-a-gaming-wifi.html",
            description: "ASUS ROG Strix Z790-A Gaming WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming Z790-Plus WiFi Review",
            type: "Review",
            url: "review-asus-tuf-gaming-z790-plus-wifi.html",
            description: "ASUS TUF Gaming Z790-Plus WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime Z790-A WiFi Review",
            type: "Review",
            url: "review-asus-prime-z790-a-wifi.html",
            description: "ASUS Prime Z790-A WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG Z790 Carbon WiFi Review",
            type: "Review",
            url: "review-msi-mpg-z790-carbon-wifi.html",
            description: "MSI MPG Z790 Carbon WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG Z790 Edge WiFi Review",
            type: "Review",
            url: "review-msi-mpg-z790-edge-wifi.html",
            description: "MSI MPG Z790 Edge WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE Z790 AORUS Elite AX Review",
            type: "Review",
            url: "review-gigabyte-z790-aorus-elite-ax.html",
            description: "GIGABYTE Z790 AORUS Elite AX - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "ASRock Z790 Steel Legend WiFi Review",
            type: "Review",
            url: "review-asrock-z790-steel-legend-wifi.html",
            description: "ASRock Z790 Steel Legend WiFi - LGA 1700 Z790 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE B760 AORUS Elite AX DDR4 Review",
            type: "Review",
            url: "review-gigabyte-b760-aorus-elite-ax-ddr4.html",
            description: "GIGABYTE B760 AORUS Elite AX DDR4 - LGA 1700 B760 ATX DDR4 motherboard review"
        },
        {
            title: "MSI MAG B760M Mortar WiFi Review",
            type: "Review",
            url: "review-msi-mag-b760m-mortar-wifi.html",
            description: "MSI MAG B760M Mortar WiFi - LGA 1700 B760 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime B760M-A WiFi D4 Review",
            type: "Review",
            url: "review-asus-prime-b760m-a-wifi-d4.html",
            description: "ASUS Prime B760M-A WiFi D4 - LGA 1700 B760 Micro-ATX DDR4 motherboard review"
        },
        {
            title: "GIGABYTE B760M DS3H AX DDR4 Review",
            type: "Review",
            url: "review-gigabyte-b760m-ds3h-ax-ddr4.html",
            description: "GIGABYTE B760M DS3H AX DDR4 - LGA 1700 B760 Micro-ATX DDR4 motherboard review"
        },
        {
            title: "ASRock B760M Steel Legend WiFi Review",
            type: "Review",
            url: "review-asrock-b760m-steel-legend-wifi.html",
            description: "ASRock B760M Steel Legend WiFi - LGA 1700 B760 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Maximus Z890 Hero Review",
            type: "Review",
            url: "review-asus-rog-maximus-z890-hero.html",
            description: "ASUS ROG Maximus Z890 Hero - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix Z890-E Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-z890-e-gaming-wifi.html",
            description: "ASUS ROG Strix Z890-E Gaming WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming Z890-Plus WiFi Review",
            type: "Review",
            url: "review-asus-tuf-gaming-z890-plus-wifi.html",
            description: "ASUS TUF Gaming Z890-Plus WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime Z890-P WiFi Review",
            type: "Review",
            url: "review-asus-prime-z890-p-wifi.html",
            description: "ASUS Prime Z890-P WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MEG Z890 ACE Review",
            type: "Review",
            url: "review-msi-meg-z890-ace.html",
            description: "MSI MEG Z890 ACE - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG Z890 Carbon WiFi Review",
            type: "Review",
            url: "review-msi-mpg-z890-carbon-wifi.html",
            description: "MSI MPG Z890 Carbon WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG Z890 Edge TI WiFi Review",
            type: "Review",
            url: "review-msi-mpg-z890-edge-ti-wifi.html",
            description: "MSI MPG Z890 Edge TI WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "MSI PRO Z890-A WiFi Review",
            type: "Review",
            url: "review-msi-pro-z890-a-wifi.html",
            description: "MSI PRO Z890-A WiFi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE Z890 AORUS Master Review",
            type: "Review",
            url: "review-gigabyte-z890-aorus-master.html",
            description: "GIGABYTE Z890 AORUS Master - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "ASRock Z890 Taichi Review",
            type: "Review",
            url: "review-asrock-z890-taichi.html",
            description: "ASRock Z890 Taichi - LGA 1851 Z890 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming B860-Plus WiFi Review",
            type: "Review",
            url: "review-asus-tuf-gaming-b860-plus-wifi.html",
            description: "ASUS TUF Gaming B860-Plus WiFi - LGA 1851 B860 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MAG B860 Tomahawk WiFi Review",
            type: "Review",
            url: "review-msi-mag-b860-tomahawk-wifi.html",
            description: "MSI MAG B860 Tomahawk WiFi - LGA 1851 B860 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE B860 AORUS Elite WiFi7 Review",
            type: "Review",
            url: "review-gigabyte-b860-aorus-elite-wifi7.html",
            description: "GIGABYTE B860 AORUS Elite WiFi7 - LGA 1851 B860 ATX DDR5 motherboard review"
        },
        {
            title: "ASRock B860M Pro RS WiFi Review",
            type: "Review",
            url: "review-asrock-b860m-pro-rs-wifi.html",
            description: "ASRock B860M Pro RS WiFi - LGA 1851 B860 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Crosshair X670E Hero Review",
            type: "Review",
            url: "review-asus-rog-crosshair-x670e-hero.html",
            description: "ASUS ROG Crosshair X670E Hero - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "MSI MEG X670E ACE Review",
            type: "Review",
            url: "review-msi-meg-x670e-ace.html",
            description: "MSI MEG X670E ACE - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "ASRock X670E Taichi Review",
            type: "Review",
            url: "review-asrock-x670e-taichi.html",
            description: "ASRock X670E Taichi - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG X670E Carbon WiFi Review",
            type: "Review",
            url: "review-msi-mpg-x670e-carbon-wifi.html",
            description: "MSI MPG X670E Carbon WiFi - AM5 X670E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix B650E-E Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-b650e-e-gaming-wifi.html",
            description: "ASUS ROG Strix B650E-E Gaming WiFi - AM5 B650E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming B650-Plus WiFi Review",
            type: "Review",
            url: "review-asus-tuf-gaming-b650-plus-wifi.html",
            description: "ASUS TUF Gaming B650-Plus WiFi - AM5 B650 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime B650M-A AX II Review",
            type: "Review",
            url: "review-asus-prime-b650m-a-ax-ii.html",
            description: "ASUS Prime B650M-A AX II - AM5 B650 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "MSI MAG B650 Tomahawk WiFi Review",
            type: "Review",
            url: "review-msi-mag-b650-tomahawk-wifi.html",
            description: "MSI MAG B650 Tomahawk WiFi - AM5 B650 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MAG B650M Mortar WiFi Review",
            type: "Review",
            url: "review-msi-mag-b650m-mortar-wifi.html",
            description: "MSI MAG B650M Mortar WiFi - AM5 B650 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE B650M AORUS Elite AX Review",
            type: "Review",
            url: "review-gigabyte-b650m-aorus-elite-ax.html",
            description: "GIGABYTE B650M AORUS Elite AX - AM5 B650 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Crosshair X870E Hero Review",
            type: "Review",
            url: "review-asus-rog-crosshair-x870e-hero.html",
            description: "ASUS ROG Crosshair X870E Hero - AM5 X870E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix X870E-E Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-x870e-e-gaming-wifi.html",
            description: "ASUS ROG Strix X870E-E Gaming WiFi - AM5 X870E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS TUF Gaming X870-Plus WiFi Review",
            type: "Review",
            url: "review-asus-tuf-gaming-x870-plus-wifi.html",
            description: "ASUS TUF Gaming X870-Plus WiFi - AM5 X870 ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime X870-P WiFi Review",
            type: "Review",
            url: "review-asus-prime-x870-p-wifi.html",
            description: "ASUS Prime X870-P WiFi - AM5 X870 ATX DDR5 motherboard review"
        },
        {
            title: "MSI MPG X870E Carbon WiFi Review",
            type: "Review",
            url: "review-msi-mpg-x870e-carbon-wifi.html",
            description: "MSI MPG X870E Carbon WiFi - AM5 X870E ATX DDR5 motherboard review"
        },
        {
            title: "MSI MAG X870 Tomahawk WiFi Review",
            type: "Review",
            url: "review-msi-mag-x870-tomahawk-wifi.html",
            description: "MSI MAG X870 Tomahawk WiFi - AM5 X870 ATX DDR5 motherboard review"
        },
        {
            title: "MSI PRO X870-P WiFi Review",
            type: "Review",
            url: "review-msi-pro-x870-p-wifi.html",
            description: "MSI PRO X870-P WiFi - AM5 X870 ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE X870E AORUS Master Review",
            type: "Review",
            url: "review-gigabyte-x870e-aorus-master.html",
            description: "GIGABYTE X870E AORUS Master - AM5 X870E ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE X870 AORUS Elite WiFi7 Review",
            type: "Review",
            url: "review-gigabyte-x870-aorus-elite-wifi7.html",
            description: "GIGABYTE X870 AORUS Elite WiFi7 - AM5 X870 ATX DDR5 motherboard review"
        },
        {
            title: "ASRock X870E Taichi Review",
            type: "Review",
            url: "review-asrock-x870e-taichi.html",
            description: "ASRock X870E Taichi - AM5 X870E ATX DDR5 motherboard review"
        },
        {
            title: "ASUS Prime A620M-A Review",
            type: "Review",
            url: "review-asus-prime-a620m-a.html",
            description: "ASUS Prime A620M-A - AM5 A620 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "MSI PRO A620M-E Review",
            type: "Review",
            url: "review-msi-pro-a620m-e.html",
            description: "MSI PRO A620M-E - AM5 A620 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE A620M DS3H Review",
            type: "Review",
            url: "review-gigabyte-a620m-ds3h.html",
            description: "GIGABYTE A620M DS3H - AM5 A620 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASRock A620M-HDV/M.2+ Review",
            type: "Review",
            url: "review-asrock-a620m-hdv-m2-plus.html",
            description: "ASRock A620M-HDV/M.2+ - AM5 A620 Micro-ATX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix B550-F Gaming WiFi II Review",
            type: "Review",
            url: "review-asus-rog-strix-b550-f-gaming-wifi-ii.html",
            description: "ASUS ROG Strix B550-F Gaming WiFi II - AM4 B550 ATX DDR4 motherboard review"
        },
        {
            title: "MSI MAG B550 Tomahawk Review",
            type: "Review",
            url: "review-msi-mag-b550-tomahawk.html",
            description: "MSI MAG B550 Tomahawk - AM4 B550 ATX DDR4 motherboard review"
        },
        {
            title: "GIGABYTE B550 AORUS Elite V2 Review",
            type: "Review",
            url: "review-gigabyte-b550-aorus-elite-v2.html",
            description: "GIGABYTE B550 AORUS Elite V2 - AM4 B550 ATX DDR4 motherboard review"
        },
        {
            title: "ASRock B550M Steel Legend Review",
            type: "Review",
            url: "review-asrock-b550m-steel-legend.html",
            description: "ASRock B550M Steel Legend - AM4 B550 Micro-ATX DDR4 motherboard review"
        },
        {
            title: "ASUS ROG Crosshair VIII Dark Hero Review",
            type: "Review",
            url: "review-asus-rog-crosshair-viii-dark-hero.html",
            description: "ASUS ROG Crosshair VIII Dark Hero - AM4 X570 ATX DDR4 motherboard review"
        },
        {
            title: "MSI MEG X570S Unify-X Max Review",
            type: "Review",
            url: "review-msi-meg-x570s-unify-x-max.html",
            description: "MSI MEG X570S Unify-X Max - AM4 X570 ATX DDR4 motherboard review"
        },
        {
            title: "ASUS ROG Strix Z790-I Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-z790-i-gaming-wifi.html",
            description: "ASUS ROG Strix Z790-I Gaming WiFi - LGA 1700 Z790 Mini-ITX DDR5 motherboard review"
        },
        {
            title: "ASUS ROG Strix B650E-I Gaming WiFi Review",
            type: "Review",
            url: "review-asus-rog-strix-b650e-i-gaming-wifi.html",
            description: "ASUS ROG Strix B650E-I Gaming WiFi - AM5 B650E Mini-ITX DDR5 motherboard review"
        },
        {
            title: "MSI MPG Z790I Edge WiFi Review",
            type: "Review",
            url: "review-msi-mpg-z790i-edge-wifi.html",
            description: "MSI MPG Z790I Edge WiFi - LGA 1700 Z790 Mini-ITX DDR5 motherboard review"
        },
        {
            title: "GIGABYTE B650I AORUS Ultra Review",
            type: "Review",
            url: "review-gigabyte-b650i-aorus-ultra.html",
            description: "GIGABYTE B650I AORUS Ultra - AM5 B650 Mini-ITX DDR5 motherboard review"
        },
        {
            title: "ASRock B760M-ITX/D4 WiFi Review",
            type: "Review",
            url: "review-asrock-b760m-itx-d4-wifi.html",
            description: "ASRock B760M-ITX/D4 WiFi - LGA 1700 B760 Mini-ITX DDR4 motherboard review"
        },

        // CPU Buying Guides - 8 Guides
        {
            title: 'Best Motherboards for Core Ultra 9 285K',
            type: 'Guide',
            url: 'best-motherboard-for-core-ultra-9-285k.html',
            description: 'Top Z890 motherboards for Intel flagship Arrow Lake CPU'
        },
        {
            title: 'Best Motherboards for Core Ultra 5 245K',
            type: 'Guide',
            url: 'best-motherboard-for-core-ultra-5-245k.html',
            description: 'Best B860 and Z890 boards for mid-range Arrow Lake'
        },
        {
            title: 'Best Motherboards for i7-14700K',
            type: 'Guide',
            url: 'best-motherboard-for-i7-14700k.html',
            description: 'Top Z790 boards for gaming and productivity on LGA 1700'
        },
        {
            title: 'Best Motherboards for i5-12400F',
            type: 'Guide',
            url: 'best-motherboard-for-i5-12400f.html',
            description: 'Budget B760 boards for affordable gaming builds'
        },
        {
            title: 'Best Motherboards for Ryzen 9 9950X',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-9-9950x.html',
            description: 'Top X870E boards for AMD flagship Zen 5 processor'
        },
        {
            title: 'Best Motherboards for Ryzen 7 9700X',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-7-9700x.html',
            description: 'Best X870 and B650 boards for mid-range AM5 builds'
        },
        {
            title: 'Best Motherboards for Ryzen 7 7800X3D',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-7-7800x3d.html',
            description: 'Top B650 and X670E boards for the ultimate gaming CPU'
        },
        {
            title: 'Best Motherboards for Ryzen 5 5600X',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-5-5600x.html',
            description: 'Best B550 boards for budget AM4 gaming builds'
        },

        // Legacy CPU Buying Guides
        {
            title: 'Best Motherboards for i9-9900K',
            type: 'Guide',
            url: 'best-motherboard-for-i9-9900k.html',
            description: 'Best Z390 boards for the legendary Coffee Lake flagship'
        },
        {
            title: 'Best Motherboards for Ryzen 5 3600',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-5-3600.html',
            description: 'Best B550 and B450 boards for the budget Zen 2 legend'
        },
        {
            title: 'Best Motherboards for Ryzen 7 3700X',
            type: 'Guide',
            url: 'best-motherboard-for-ryzen-7-3700x.html',
            description: 'Best B550 and X570 boards for the 8-core Zen 2 workhorse'
        },

        // Guides - 7 Guides
        {
            title: 'How to Choose the Right Motherboard',
            type: 'Guide',
            url: 'guide-how-to-choose-motherboard.html',
            description: 'Complete beginner\'s guide to selecting the perfect motherboard for your needs and budget.'
        },
        {
            title: 'Intel vs AMD: Platform Comparison',
            type: 'Guide',
            url: 'guide-intel-vs-amd.html',
            description: 'In-depth comparison of Intel LGA 1700 and AMD AM5 platforms for 2024 builds.'
        },
        {
            title: 'Understanding Motherboard Form Factors',
            type: 'Guide',
            url: 'guide-form-factors.html',
            description: 'ATX, Micro-ATX, Mini-ITX explained - which form factor is right for your PC build.'
        },
        {
            title: 'DDR4 vs DDR5: RAM Guide',
            type: 'Guide',
            url: 'guide-ddr4-vs-ddr5.html',
            description: 'Everything you need to know about DDR4 and DDR5 memory for modern motherboards.'
        },
        {
            title: 'BIOS Settings and Optimization',
            type: 'Guide',
            url: 'guide-bios-settings.html',
            description: 'Master your motherboard BIOS - essential settings, XMP profiles, and performance tuning.'
        },
        {
            title: 'VRM and Power Delivery Explained',
            type: 'Guide',
            url: 'guide-vrm-power-delivery.html',
            description: 'Understanding VRM phases, power stages, and why they matter for CPU performance.'
        },
        {
            title: 'PCIe Generations and Slot Guide',
            type: 'Guide',
            url: 'guide-pcie-slots.html',
            description: 'PCIe 3.0, 4.0, and 5.0 explained - bandwidth, compatibility, and what you need.'
        },

        // Compare Page
        {
            title: 'Motherboard Comparison Tool',
            type: 'Tool',
            url: 'compare.html',
            description: 'Compare motherboard specs side-by-side. Find the best board for your build.'
        }
    ];

    const searchInput = document.querySelector('.search-input');
    let searchDropdown = document.querySelector('.search-dropdown');

    // Create search dropdown dynamically if it does not exist
    if (searchInput && !searchDropdown) {
        searchDropdown = document.createElement('div');
        searchDropdown.className = 'search-dropdown';
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(searchDropdown);
    }

    const renderSearchResults = (results) => {
        if (!searchDropdown) return;

        if (results.length === 0) {
            searchDropdown.innerHTML = '<div class="search-no-results">No results found.</div>';
            searchDropdown.classList.add('active');
            return;
        }

        searchDropdown.innerHTML = results.map(item => `
            <a href="${item.url}" class="search-result-item">
                <span class="search-result-badge badge-${item.type.toLowerCase()}">${item.type}</span>
                <div class="search-result-text">
                    <strong class="search-result-title">${item.title}</strong>
                    <span class="search-result-desc">${item.description}</span>
                </div>
            </a>
        `).join('');

        searchDropdown.classList.add('active');
    };

    const closeSearchDropdown = () => {
        searchDropdown?.classList.remove('active');
    };

    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            closeSearchDropdown();
            return;
        }

        const filtered = searchIndex.filter(item => {
            return item.title.toLowerCase().includes(query)
                || item.description.toLowerCase().includes(query)
                || item.type.toLowerCase().includes(query);
        });

        renderSearchResults(filtered);
    });

    // Close dropdown on focus out / click outside
    document.addEventListener('click', (e) => {
        if (!searchInput?.contains(e.target) && !searchDropdown?.contains(e.target)) {
            closeSearchDropdown();
        }
    });

    // Re-open when focusing back on search input that has a query
    searchInput?.addEventListener('focus', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length >= 2) {
            const filtered = searchIndex.filter(item => {
                return item.title.toLowerCase().includes(query)
                    || item.description.toLowerCase().includes(query)
                    || item.type.toLowerCase().includes(query);
            });
            renderSearchResults(filtered);
        }
    });


    // --------------------------------------------------------
    // 5. REVIEWS PAGE FILTERS (only on reviews.html)
    // --------------------------------------------------------

    const filterBrand = document.getElementById('filter-brand');
    const filterSocket = document.getElementById('filter-socket');
    const filterChipset = document.getElementById('filter-chipset');
    const filterForm = document.getElementById('filter-form');
    const filterPrice = document.getElementById('filter-price');
    const filterSearch = document.getElementById('filter-search');

    const isReviewsPage = filterBrand || filterSocket || filterChipset || filterForm || filterPrice || filterSearch;

    if (isReviewsPage) {
        const reviewCards = document.querySelectorAll('.review-card');
        const filterCountEl = document.querySelector('.filter-count strong');
        const noResultsEl = document.querySelector('.no-results');

        const applyFilters = () => {
            const brand = filterBrand?.value || 'all';
            const socket = filterSocket?.value || 'all';
            const chipset = filterChipset?.value || 'all';
            const form = filterForm?.value || 'all';
            const priceRange = filterPrice?.value || 'all';
            const searchText = filterSearch?.value?.trim().toLowerCase() || '';

            let visibleCount = 0;

            reviewCards.forEach(card => {
                const cardBrand = card.dataset.brand?.toLowerCase() || '';
                const cardSocket = card.dataset.socket?.toLowerCase() || '';
                const cardChipset = card.dataset.chipset?.toLowerCase() || '';
                const cardForm = card.dataset.form?.toLowerCase() || '';
                const cardPrice = parseFloat(card.dataset.price) || 0;
                const cardText = card.textContent.toLowerCase();

                let show = true;

                // Brand filter
                if (brand !== 'all' && cardBrand !== brand.toLowerCase()) {
                    show = false;
                }

                // Socket filter
                if (socket !== 'all' && cardSocket !== socket.toLowerCase()) {
                    show = false;
                }

                // Chipset filter
                if (chipset !== 'all' && cardChipset !== chipset.toLowerCase()) {
                    show = false;
                }

                // Form factor filter
                if (form !== 'all' && cardForm !== form.toLowerCase()) {
                    show = false;
                }

                // Price range filter
                if (priceRange !== 'all') {
                    const [minStr, maxStr] = priceRange.split('-');
                    const min = parseFloat(minStr) || 0;
                    const max = maxStr ? parseFloat(maxStr) : Infinity;
                    if (cardPrice < min || cardPrice > max) {
                        show = false;
                    }
                }

                // Search text filter
                if (searchText && !cardText.includes(searchText)) {
                    show = false;
                }

                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            // Update count display
            if (filterCountEl) {
                filterCountEl.textContent = visibleCount;
            }

            // Show/hide no results message
            if (noResultsEl) {
                noResultsEl.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        };

        // Attach change listeners to all filter selects
        [filterBrand, filterSocket, filterChipset, filterForm, filterPrice].forEach(select => {
            select?.addEventListener('change', applyFilters);
        });

        // Attach input listener to search filter
        filterSearch?.addEventListener('input', applyFilters);

        // Read URL parameters and apply as filter presets
        const urlParams = new URLSearchParams(window.location.search);
        const paramMap = {
            brand: filterBrand,
            socket: filterSocket,
            chipset: filterChipset,
            form: filterForm,
            price: filterPrice,
            q: filterSearch
        };
        for (const [key, el] of Object.entries(paramMap)) {
            const val = urlParams.get(key);
            if (val && el) {
                // For select elements, find the matching option
                if (el.tagName === 'SELECT') {
                    const opts = Array.from(el.options);
                    const match = opts.find(o => o.value.toLowerCase() === val.toLowerCase());
                    if (match) el.value = match.value;
                } else {
                    el.value = val;
                }
            }
        }

        // Run filters on load (applies URL params if any)
        applyFilters();
    }


    // --------------------------------------------------------
    // 6. COMPARISON PAGE (only on compare.html)
    // --------------------------------------------------------

    const compareSlots = document.getElementById('compare-slots');
    const compareTableWrap = document.getElementById('compare-table-wrap');

    if (compareSlots && compareTableWrap) {

        const AFFILIATE_TAG = 'motherboardcentral.com-20';

        const motherboardDatabase = [
{
                name: 'ASUS ROG Maximus Z790 Hero',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x16',
                m2Slots: '5x M.2',
                sataPortsCount: 6,
                usbRearPorts: '12x USB (incl. TB4)',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G+1G',
                audioCodec: 'ALC4082',
                powerPhases: '20+1',
                rating: 4.8,
                amazonSearch: 'ASUS+ROG+Maximus+Z790+Hero+motherboard'
            },
            {
                name: 'MSI MAG B760 Tomahawk WiFi',
                brand: 'MSI',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1+1',
                rating: 4.6,
                amazonSearch: 'MSI+MAG+B760+Tomahawk+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE B650 AORUS Elite AX',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+2+1',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+B650+AORUS+Elite+AX+motherboard'
            },
            {
                name: 'ASUS ROG Strix X670E-E Gaming WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '11x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '18+2',
                rating: 4.7,
                amazonSearch: 'ASUS+ROG+Strix+X670E-E+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming B760-PLUS WiFi D4',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1',
                rating: 4.4,
                amazonSearch: 'ASUS+TUF+Gaming+B760-PLUS+WiFi+D4+motherboard'
            },
            {
                name: 'ASRock B760M Pro RS/D4',
                brand: 'ASRock',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Micro-ATX',
                ramType: 'DDR4',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 2,
                usbRearPorts: '6x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC897',
                powerPhases: '8+1+1',
                rating: 4.2,
                amazonSearch: 'ASRock+B760M+Pro+RS%2FD4+motherboard'
            },
            {
                name: 'MSI PRO B650-P WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+2+1',
                rating: 4.3,
                amazonSearch: 'MSI+PRO+B650-P+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE X670E AORUS Master',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '12x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '10G+2.5G',
                audioCodec: 'ALC1220-VB',
                powerPhases: '16+2+1',
                rating: 4.7,
                amazonSearch: 'GIGABYTE+X670E+AORUS+Master+motherboard'
            },
            {
                name: 'ASUS ROG Strix Z790-E Gaming WiFi II',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '10x USB (incl. TB4)',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '18+1',
                rating: 4.7,
                amazonSearch: 'ASUS+ROG+Strix+Z790-E+Gaming+WiFi+II+motherboard'
            },
            {
                name: 'ASUS ROG Strix Z790-A Gaming WiFi',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x4',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+1',
                rating: 4.6,
                amazonSearch: 'ASUS+ROG+Strix+Z790-A+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming Z790-Plus WiFi',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x4',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+1',
                rating: 4.5,
                amazonSearch: 'ASUS+TUF+Gaming+Z790-Plus+WiFi+motherboard'
            },
            {
                name: 'ASUS Prime Z790-A WiFi',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+1',
                rating: 4.4,
                amazonSearch: 'ASUS+Prime+Z790-A+WiFi+motherboard'
            },
            {
                name: 'MSI MPG Z790 Carbon WiFi',
                brand: 'MSI',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x16',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '11x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '19+1+1',
                rating: 4.7,
                amazonSearch: 'MSI+MPG+Z790+Carbon+WiFi+motherboard'
            },
            {
                name: 'MSI MPG Z790 Edge WiFi',
                brand: 'MSI',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+1+1',
                rating: 4.5,
                amazonSearch: 'MSI+MPG+Z790+Edge+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE Z790 AORUS Elite AX',
                brand: 'GIGABYTE',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC1220',
                powerPhases: '16+1+1',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+Z790+AORUS+Elite+AX+motherboard'
            },
            {
                name: 'ASRock Z790 Steel Legend WiFi',
                brand: 'ASRock',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+1+1',
                rating: 4.4,
                amazonSearch: 'ASRock+Z790+Steel+Legend+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE B760 AORUS Elite AX DDR4',
                brand: 'GIGABYTE',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1+1',
                rating: 4.4,
                amazonSearch: 'GIGABYTE+B760+AORUS+Elite+AX+DDR4+motherboard'
            },
            {
                name: 'MSI MAG B760M Mortar WiFi',
                brand: 'MSI',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1+1',
                rating: 4.5,
                amazonSearch: 'MSI+MAG+B760M+Mortar+WiFi+motherboard'
            },
            {
                name: 'ASUS Prime B760M-A WiFi D4',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Micro-ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '10+1',
                rating: 4.3,
                amazonSearch: 'ASUS+Prime+B760M-A+WiFi+D4+motherboard'
            },
            {
                name: 'GIGABYTE B760M DS3H AX DDR4',
                brand: 'GIGABYTE',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Micro-ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '8+1+1',
                rating: 4.1,
                amazonSearch: 'GIGABYTE+B760M+DS3H+AX+DDR4+motherboard'
            },
            {
                name: 'ASRock B760M Steel Legend WiFi',
                brand: 'ASRock',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '10+1+1',
                rating: 4.4,
                amazonSearch: 'ASRock+B760M+Steel+Legend+WiFi+motherboard'
            },
            {
                name: 'ASUS ROG Maximus Z890 Hero',
                brand: 'ASUS',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 5.0 x4',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '14x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '24+1',
                rating: 4.9,
                amazonSearch: 'ASUS+ROG+Maximus+Z890+Hero+motherboard'
            },
            {
                name: 'ASUS ROG Strix Z890-E Gaming WiFi',
                brand: 'ASUS',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x4',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '11x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '20+1',
                rating: 4.7,
                amazonSearch: 'ASUS+ROG+Strix+Z890-E+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming Z890-Plus WiFi',
                brand: 'ASUS',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+1',
                rating: 4.6,
                amazonSearch: 'ASUS+TUF+Gaming+Z890-Plus+WiFi+motherboard'
            },
            {
                name: 'ASUS Prime Z890-P WiFi',
                brand: 'ASUS',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+1',
                rating: 4.4,
                amazonSearch: 'ASUS+Prime+Z890-P+WiFi+motherboard'
            },
            {
                name: 'MSI MEG Z890 ACE',
                brand: 'MSI',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 5.0 x4',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '13x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '22+1+1',
                rating: 4.8,
                amazonSearch: 'MSI+MEG+Z890+ACE+motherboard'
            },
            {
                name: 'MSI MPG Z890 Carbon WiFi',
                brand: 'MSI',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 4.0 x16',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '11x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '20+1+1',
                rating: 4.7,
                amazonSearch: 'MSI+MPG+Z890+Carbon+WiFi+motherboard'
            },
            {
                name: 'MSI MPG Z890 Edge TI WiFi',
                brand: 'MSI',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '10x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '18+1+1',
                rating: 4.6,
                amazonSearch: 'MSI+MPG+Z890+Edge+TI+WiFi+motherboard'
            },
            {
                name: 'MSI PRO Z890-A WiFi',
                brand: 'MSI',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+1+1',
                rating: 4.4,
                amazonSearch: 'MSI+PRO+Z890-A+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE Z890 AORUS Master',
                brand: 'GIGABYTE',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 5.0 x4',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '14x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '10G+2.5G',
                audioCodec: 'ALC1220-VB',
                powerPhases: '20+1+2',
                rating: 4.8,
                amazonSearch: 'GIGABYTE+Z890+AORUS+Master+motherboard'
            },
            {
                name: 'ASRock Z890 Taichi',
                brand: 'ASRock',
                socket: 'LGA 1851',
                chipset: 'Z890',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16, 1x PCIe 5.0 x4',
                m2Slots: '5x M.2',
                sataPortsCount: 4,
                usbRearPorts: '12x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '22+1+2',
                rating: 4.8,
                amazonSearch: 'ASRock+Z890+Taichi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming B860-Plus WiFi',
                brand: 'ASUS',
                socket: 'LGA 1851',
                chipset: 'B860',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1',
                rating: 4.5,
                amazonSearch: 'ASUS+TUF+Gaming+B860-Plus+WiFi+motherboard'
            },
            {
                name: 'MSI MAG B860 Tomahawk WiFi',
                brand: 'MSI',
                socket: 'LGA 1851',
                chipset: 'B860',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+1+1',
                rating: 4.6,
                amazonSearch: 'MSI+MAG+B860+Tomahawk+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE B860 AORUS Elite WiFi7',
                brand: 'GIGABYTE',
                socket: 'LGA 1851',
                chipset: 'B860',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+1+1',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+B860+AORUS+Elite+WiFi7+motherboard'
            },
            {
                name: 'ASRock B860M Pro RS WiFi',
                brand: 'ASRock',
                socket: 'LGA 1851',
                chipset: 'B860',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '192GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '10+1+1',
                rating: 4.3,
                amazonSearch: 'ASRock+B860M+Pro+RS+WiFi+motherboard'
            },
            {
                name: 'ASUS ROG Crosshair X670E Hero',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '13x USB (incl. TB4)',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '18+2',
                rating: 4.8,
                amazonSearch: 'ASUS+ROG+Crosshair+X670E+Hero+motherboard'
            },
            {
                name: 'MSI MEG X670E ACE',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '12x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '18+2+1',
                rating: 4.7,
                amazonSearch: 'MSI+MEG+X670E+ACE+motherboard'
            },
            {
                name: 'ASRock X670E Taichi',
                brand: 'ASRock',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '11x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '18+2+1',
                rating: 4.7,
                amazonSearch: 'ASRock+X670E+Taichi+motherboard'
            },
            {
                name: 'MSI MPG X670E Carbon WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'X670E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '10x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+2+1',
                rating: 4.6,
                amazonSearch: 'MSI+MPG+X670E+Carbon+WiFi+motherboard'
            },
            {
                name: 'ASUS ROG Strix B650E-E Gaming WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'B650E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+2',
                rating: 4.6,
                amazonSearch: 'ASUS+ROG+Strix+B650E-E+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming B650-Plus WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+2',
                rating: 4.4,
                amazonSearch: 'ASUS+TUF+Gaming+B650-Plus+WiFi+motherboard'
            },
            {
                name: 'ASUS Prime B650M-A AX II',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '10+2',
                rating: 4.3,
                amazonSearch: 'ASUS+Prime+B650M-A+AX+II+motherboard'
            },
            {
                name: 'MSI MAG B650 Tomahawk WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+2+1',
                rating: 4.5,
                amazonSearch: 'MSI+MAG+B650+Tomahawk+WiFi+motherboard'
            },
            {
                name: 'MSI MAG B650M Mortar WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '12+2+1',
                rating: 4.5,
                amazonSearch: 'MSI+MAG+B650M+Mortar+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE B650M AORUS Elite AX',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '10+2+1',
                rating: 4.4,
                amazonSearch: 'GIGABYTE+B650M+AORUS+Elite+AX+motherboard'
            },
            {
                name: 'ASUS ROG Crosshair X870E Hero',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X870E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '14x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '22+2',
                rating: 4.9,
                amazonSearch: 'ASUS+ROG+Crosshair+X870E+Hero+motherboard'
            },
            {
                name: 'ASUS ROG Strix X870E-E Gaming WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X870E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '12x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '18+2',
                rating: 4.7,
                amazonSearch: 'ASUS+ROG+Strix+X870E-E+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS TUF Gaming X870-Plus WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X870',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+2',
                rating: 4.6,
                amazonSearch: 'ASUS+TUF+Gaming+X870-Plus+WiFi+motherboard'
            },
            {
                name: 'ASUS Prime X870-P WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'X870',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+2',
                rating: 4.4,
                amazonSearch: 'ASUS+Prime+X870-P+WiFi+motherboard'
            },
            {
                name: 'MSI MPG X870E Carbon WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'X870E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '12x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '20+2+1',
                rating: 4.8,
                amazonSearch: 'MSI+MPG+X870E+Carbon+WiFi+motherboard'
            },
            {
                name: 'MSI MAG X870 Tomahawk WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'X870',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '10x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '16+2+1',
                rating: 4.6,
                amazonSearch: 'MSI+MAG+X870+Tomahawk+WiFi+motherboard'
            },
            {
                name: 'MSI PRO X870-P WiFi',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'X870',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '8x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '14+2+1',
                rating: 4.4,
                amazonSearch: 'MSI+PRO+X870-P+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE X870E AORUS Master',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'X870E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '14x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '10G+2.5G',
                audioCodec: 'ALC1220-VB',
                powerPhases: '20+2+1',
                rating: 4.8,
                amazonSearch: 'GIGABYTE+X870E+AORUS+Master+motherboard'
            },
            {
                name: 'GIGABYTE X870 AORUS Elite WiFi7',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'X870',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 4,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '2.5G',
                audioCodec: 'ALC1220',
                powerPhases: '16+2+1',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+X870+AORUS+Elite+WiFi7+motherboard'
            },
            {
                name: 'ASRock X870E Taichi',
                brand: 'ASRock',
                socket: 'AM5',
                chipset: 'X870E',
                formFactor: 'ATX',
                ramType: 'DDR5',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 5.0 x16',
                m2Slots: '4x M.2',
                sataPortsCount: 4,
                usbRearPorts: '13x USB (incl. TB4)',
                wifi: 'WiFi 7',
                bluetooth: 'BT 5.4',
                lan: '5G+2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '22+2+1',
                rating: 4.8,
                amazonSearch: 'ASRock+X870E+Taichi+motherboard'
            },
            {
                name: 'ASUS Prime A620M-A',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'A620',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC897',
                powerPhases: '8+2',
                rating: 4.1,
                amazonSearch: 'ASUS+Prime+A620M-A+motherboard'
            },
            {
                name: 'MSI PRO A620M-E',
                brand: 'MSI',
                socket: 'AM5',
                chipset: 'A620',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC897',
                powerPhases: '7+2+1',
                rating: 4.0,
                amazonSearch: 'MSI+PRO+A620M-E+motherboard'
            },
            {
                name: 'GIGABYTE A620M DS3H',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'A620',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '1x M.2',
                sataPortsCount: 4,
                usbRearPorts: '5x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC897',
                powerPhases: '6+2+1',
                rating: 3.9,
                amazonSearch: 'GIGABYTE+A620M+DS3H+motherboard'
            },
            {
                name: 'ASRock A620M-HDV/M.2+',
                brand: 'ASRock',
                socket: 'AM5',
                chipset: 'A620',
                formFactor: 'Micro-ATX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC897',
                powerPhases: '6+2',
                rating: 4.0,
                amazonSearch: 'ASRock+A620M-HDV%2FM.2%2B+motherboard'
            },
            {
                name: 'ASUS ROG Strix B550-F Gaming WiFi II',
                brand: 'ASUS',
                socket: 'AM4',
                chipset: 'B550',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 6,
                usbRearPorts: '9x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '14+2',
                rating: 4.6,
                amazonSearch: 'ASUS+ROG+Strix+B550-F+Gaming+WiFi+II+motherboard'
            },
            {
                name: 'MSI MAG B550 Tomahawk',
                brand: 'MSI',
                socket: 'AM4',
                chipset: 'B550',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 6,
                usbRearPorts: '7x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '2.5G',
                audioCodec: 'ALC1200',
                powerPhases: '12+2+1',
                rating: 4.7,
                amazonSearch: 'MSI+MAG+B550+Tomahawk+motherboard'
            },
            {
                name: 'GIGABYTE B550 AORUS Elite V2',
                brand: 'GIGABYTE',
                socket: 'AM4',
                chipset: 'B550',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 6,
                usbRearPorts: '7x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '2.5G',
                audioCodec: 'ALC1200',
                powerPhases: '12+2',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+B550+AORUS+Elite+V2+motherboard'
            },
            {
                name: 'ASRock B550M Steel Legend',
                brand: 'ASRock',
                socket: 'AM4',
                chipset: 'B550',
                formFactor: 'Micro-ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '1G',
                audioCodec: 'ALC1200',
                powerPhases: '10+2',
                rating: 4.4,
                amazonSearch: 'ASRock+B550M+Steel+Legend+motherboard'
            },
            {
                name: 'ASUS ROG Crosshair VIII Dark Hero',
                brand: 'ASUS',
                socket: 'AM4',
                chipset: 'X570',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 4,
                maxRam: '128GB',
                pcieSlots: '2x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 8,
                usbRearPorts: '10x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.1',
                lan: '2.5G',
                audioCodec: 'ALC4082',
                powerPhases: '16+2',
                rating: 4.8,
                amazonSearch: 'ASUS+ROG+Crosshair+VIII+Dark+Hero+motherboard'
            },
            {
                name: 'MSI MEG X570S Unify-X Max',
                brand: 'MSI',
                socket: 'AM4',
                chipset: 'X570',
                formFactor: 'ATX',
                ramType: 'DDR4',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '2x PCIe 4.0 x16',
                m2Slots: '3x M.2',
                sataPortsCount: 6,
                usbRearPorts: '9x USB',
                wifi: 'No WiFi',
                bluetooth: 'No BT',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '14+2+1',
                rating: 4.7,
                amazonSearch: 'MSI+MEG+X570S+Unify-X+Max+motherboard'
            },
            {
                name: 'ASUS ROG Strix Z790-I Gaming WiFi',
                brand: 'ASUS',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'Mini-ITX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '8x USB (incl. TB4)',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '14+1',
                rating: 4.7,
                amazonSearch: 'ASUS+ROG+Strix+Z790-I+Gaming+WiFi+motherboard'
            },
            {
                name: 'ASUS ROG Strix B650E-I Gaming WiFi',
                brand: 'ASUS',
                socket: 'AM5',
                chipset: 'B650E',
                formFactor: 'Mini-ITX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '12+2',
                rating: 4.6,
                amazonSearch: 'ASUS+ROG+Strix+B650E-I+Gaming+WiFi+motherboard'
            },
            {
                name: 'MSI MPG Z790I Edge WiFi',
                brand: 'MSI',
                socket: 'LGA 1700',
                chipset: 'Z790',
                formFactor: 'Mini-ITX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 5.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '7x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.3',
                lan: '2.5G',
                audioCodec: 'ALC4080',
                powerPhases: '12+1+1',
                rating: 4.6,
                amazonSearch: 'MSI+MPG+Z790I+Edge+WiFi+motherboard'
            },
            {
                name: 'GIGABYTE B650I AORUS Ultra',
                brand: 'GIGABYTE',
                socket: 'AM5',
                chipset: 'B650',
                formFactor: 'Mini-ITX',
                ramType: 'DDR5',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'WiFi 6E',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC1220',
                powerPhases: '10+2+1',
                rating: 4.5,
                amazonSearch: 'GIGABYTE+B650I+AORUS+Ultra+motherboard'
            },
            {
                name: 'ASRock B760M-ITX/D4 WiFi',
                brand: 'ASRock',
                socket: 'LGA 1700',
                chipset: 'B760',
                formFactor: 'Mini-ITX',
                ramType: 'DDR4',
                ramSlots: 2,
                maxRam: '64GB',
                pcieSlots: '1x PCIe 4.0 x16',
                m2Slots: '2x M.2',
                sataPortsCount: 4,
                usbRearPorts: '6x USB',
                wifi: 'WiFi 6',
                bluetooth: 'BT 5.2',
                lan: '2.5G',
                audioCodec: 'ALC897',
                powerPhases: '8+1+1',
                rating: 4.3,
                amazonSearch: 'ASRock+B760M-ITX%2FD4+WiFi+motherboard'
            }
        ];

        const specRows = [
            { label: 'Brand', key: 'brand', compare: null },
            { label: 'Socket', key: 'socket', compare: null },
            { label: 'Chipset', key: 'chipset', compare: null },
            { label: 'Form Factor', key: 'formFactor', compare: null },
            { label: 'RAM Type', key: 'ramType', compare: 'ddr' },
            { label: 'RAM Slots', key: 'ramSlots', compare: 'higher' },
            { label: 'Max RAM', key: 'maxRam', compare: 'higherGB' },
            { label: 'PCIe Slots', key: 'pcieSlots', compare: null },
            { label: 'M.2 Slots', key: 'm2Slots', compare: 'higherM2' },
            { label: 'SATA Ports', key: 'sataPortsCount', compare: 'higher' },
            { label: 'Rear USB', key: 'usbRearPorts', compare: 'higherUSB' },
            { label: 'WiFi', key: 'wifi', compare: 'wifi' },
            { label: 'Bluetooth', key: 'bluetooth', compare: 'bt' },
            { label: 'LAN', key: 'lan', compare: 'lan' },
            { label: 'Audio Codec', key: 'audioCodec', compare: null },
            { label: 'Power Phases', key: 'powerPhases', compare: 'phases' },
            { label: 'Rating', key: 'rating', compare: 'higher', format: v => `${v} / 5.0` }
        ];

        const MIN_SLOTS = 2;
        const MAX_SLOTS = 5;
        const BOARDS_PARAM = 'boards';

        let selectedBoards = [null, null];
        let showDifferencesOnly = false;

        // ---- Shareable URL state (issue #38) ------------------------------
        // The comparison is addressable via ?boards=<slug>,<slug>. Slugs are
        // derived from the board name, never from its index in
        // motherboardDatabase, so inserting a board cannot silently repoint
        // links people have already shared. The slug also matches the board's
        // review-page filename (review-<slug>.html).

        const slugify = (name) => String(name)
            .toLowerCase()
            .replace(/\./g, '')       // "M.2" -> "m2"
            .replace(/\+/g, ' plus ') // "M.2+" -> "m2 plus"
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const boardSlugs = motherboardDatabase.map(b => slugify(b.name));

        const slugToIndex = Object.create(null);
        boardSlugs.forEach((slug, i) => {
            if (!(slug in slugToIndex)) slugToIndex[slug] = i;
        });

        // Returns the slot array described by the URL, or null to keep today's
        // default. Anything unrecognised (unknown, misspelled, blank or
        // repeated) becomes an empty slot rather than an error.
        function selectionFromUrl() {
            const raw = new URLSearchParams(window.location.search).get(BOARDS_PARAM);
            if (!raw) return null;

            const taken = [];
            const slots = raw.split(',').slice(0, MAX_SLOTS).map(part => {
                const slug = part.trim().toLowerCase();
                if (!(slug in slugToIndex)) return null;
                if (taken.indexOf(slug) !== -1) return null;
                taken.push(slug);
                return slugToIndex[slug];
            });

            while (slots.length < MIN_SLOTS) slots.push(null);
            return slots;
        }

        // Trailing empty slots carry no information, so they are dropped;
        // an empty slot between two boards is kept so columns stay put.
        function boardsParamValue() {
            const slugs = selectedBoards.map(idx => idx !== null ? boardSlugs[idx] : '');
            while (slugs.length && slugs[slugs.length - 1] === '') slugs.pop();
            return slugs.join(',');
        }

        // replaceState, not pushState: a comparison is one destination, and a
        // history entry per dropdown change would trap the back button.
        function syncUrl() {
            if (typeof history === 'undefined' || !history.replaceState) return;

            const others = new URLSearchParams(window.location.search);
            others.delete(BOARDS_PARAM);

            const parts = [];
            others.forEach((value, key) => {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            });

            // Appended raw: slugs are [a-z0-9-] only, so the commas that make
            // the link readable need no escaping.
            const value = boardsParamValue();
            if (value) parts.push(BOARDS_PARAM + '=' + value);

            const query = parts.length ? '?' + parts.join('&') : '';
            history.replaceState(null, '', window.location.pathname + query + (window.location.hash || ''));
        }

        const extractNumeric = (value, type) => {
            if (type === 'higher' || type === 'lower') return parseFloat(value) || 0;
            if (type === 'higherGB') return parseInt(value) || 0;
            if (type === 'higherM2' || type === 'higherUSB') {
                const m = String(value).match(/(\d+)/);
                return m ? parseInt(m[1]) : 0;
            }
            if (type === 'ddr') {
                if (String(value).includes('DDR5')) return 5;
                if (String(value).includes('DDR4')) return 4;
                return 0;
            }
            if (type === 'wifi') {
                if (String(value).includes('6E')) return 3;
                if (String(value).includes('6')) return 2;
                if (String(value).includes('5')) return 1;
                return 0;
            }
            if (type === 'bt') {
                const m = String(value).match(/([\d.]+)/);
                return m ? parseFloat(m[1]) : 0;
            }
            if (type === 'lan') {
                if (String(value).includes('10G')) return 10;
                if (String(value).includes('2.5G')) return 2.5;
                if (String(value).includes('1G')) return 1;
                return 0;
            }
            if (type === 'phases') {
                return String(value).split('+').reduce((s, p) => s + (parseInt(p) || 0), 0);
            }
            return 0;
        };

        const getBestIndices = (values, compareType) => {
            if (!compareType) return [];
            const nums = values.map(v => v !== null ? extractNumeric(v, compareType) : null);
            const valid = nums.filter(v => v !== null);
            if (valid.length < 2) return [];
            const best = compareType === 'lower' ? Math.min(...valid) : Math.max(...valid);
            const indices = [];
            nums.forEach((v, i) => { if (v === best && v !== null) indices.push(i); });
            if (indices.length === valid.length) return [];
            return indices;
        };

        const getAmazonUrl = (board) => {
            return 'https://www.amazon.com/s?k=' + board.amazonSearch + '&tag=' + AFFILIATE_TAG;
        };

        // A row collapses only when every *selected* board renders the same
        // string. Empty slots are ignored, and one board can never "match".
        const rowIsIdentical = (displays, boards) => {
            const shown = displays.filter((d, i) => boards[i] !== null);
            if (shown.length < 2) return false;
            return shown.every(d => String(d) === String(shown[0]));
        };

        const selectedBoardCount = () => {
            return selectedBoards.filter(idx => idx !== null).length;
        };

        // "Show differences only" control. Built here rather than in
        // compare.html so the page needs no markup change, and the checked
        // state lives in JS so it survives the re-render on every selection
        // change.
        const diffToggleWrap = document.createElement('div');
        diffToggleWrap.className = 'compare-diff-toggle';
        diffToggleWrap.id = 'compare-diff-toggle';

        const diffToggleInput = document.createElement('input');
        diffToggleInput.type = 'checkbox';
        diffToggleInput.id = 'compare-diff-only';

        const diffToggleLabel = document.createElement('label');
        diffToggleLabel.setAttribute('for', 'compare-diff-only');
        diffToggleLabel.textContent = 'Show differences only';

        diffToggleWrap.appendChild(diffToggleInput);
        diffToggleWrap.appendChild(diffToggleLabel);
        compareTableWrap.parentNode.insertBefore(diffToggleWrap, compareTableWrap);

        diffToggleInput.addEventListener('change', () => {
            showDifferencesOnly = diffToggleInput.checked;
            renderTable();
        });

        // Nothing can differ with fewer than two boards on screen.
        function updateDiffToggle() {
            const usable = selectedBoardCount() >= 2;
            diffToggleWrap.hidden = !usable;
            diffToggleInput.disabled = !usable;
        }

        function renderSlots() {
            let html = '';
            selectedBoards.forEach((boardIdx, slotIdx) => {
                html += '<div class="compare-slot">';
                html += '<select class="compare-select" data-slot="' + slotIdx + '">';
                html += '<option value="">-- Select Board --</option>';
                motherboardDatabase.forEach((b, i) => {
                    const sel = i === boardIdx ? ' selected' : '';
                    html += '<option value="' + i + '"' + sel + '>' + b.name + '</option>';
                });
                html += '</select>';
                if (boardIdx !== null) {
                    const board = motherboardDatabase[boardIdx];
                    html += '<div class="compare-slot-info">';
                    html += '<h4>' + board.name + '</h4>';
                    html += '<span class="slot-meta">' + board.socket + ' &middot; ' + board.chipset + '</span>';
                    html += '</div>';
                }
                if (selectedBoards.length > MIN_SLOTS) {
                    html += '<button class="compare-remove-btn" data-slot="' + slotIdx + '" title="Remove">&times;</button>';
                }
                html += '</div>';
            });

            if (selectedBoards.length < MAX_SLOTS) {
                html += '<button class="compare-add-btn" id="add-board-btn">';
                html += '<div class="plus-icon">+</div>';
                html += '<span>Add Board</span>';
                html += '</button>';
            }

            compareSlots.innerHTML = html;

            compareSlots.querySelectorAll('.compare-select').forEach(function(sel) {
                sel.addEventListener('change', function(e) {
                    var slot = parseInt(e.target.dataset.slot);
                    var val = e.target.value;
                    selectedBoards[slot] = val !== '' ? parseInt(val) : null;
                    syncUrl();
                    renderSlots();
                    renderTable();
                });
            });

            compareSlots.querySelectorAll('.compare-remove-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var slot = parseInt(e.target.dataset.slot);
                    selectedBoards.splice(slot, 1);
                    syncUrl();
                    renderSlots();
                    renderTable();
                });
            });

            var addBtn = document.getElementById('add-board-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    selectedBoards.push(null);
                    syncUrl();
                    renderSlots();
                });
            }
        }

        function renderTable() {
            var boards = selectedBoards.map(function(idx) {
                return idx !== null ? motherboardDatabase[idx] : null;
            });
            var anySelected = boards.some(function(b) { return b !== null; });

            updateDiffToggle();

            if (!anySelected) {
                compareTableWrap.innerHTML = '<div class="compare-placeholder"><p>Select motherboards above to compare specifications side-by-side.</p></div>';
                return;
            }

            var rows = specRows.map(function(spec) {
                return {
                    spec: spec,
                    values: boards.map(function(b) { return b ? b[spec.key] : null; }),
                    displays: boards.map(function(b) {
                        if (!b) return '--';
                        return spec.format ? spec.format(b[spec.key]) : b[spec.key];
                    })
                };
            });

            if (showDifferencesOnly) {
                rows = rows.filter(function(row) {
                    return !rowIsIdentical(row.displays, boards);
                });

                if (rows.length === 0) {
                    compareTableWrap.innerHTML = '<div class="compare-placeholder"><p>These boards match on every specification we compare. Switch off &ldquo;Show differences only&rdquo; to see the full table.</p></div>';
                    return;
                }
            }

            var html = '<table><thead><tr><th>Specification</th>';
            boards.forEach(function(board) {
                html += '<th>' + (board ? board.name : '--') + '</th>';
            });
            html += '</tr></thead><tbody>';

            rows.forEach(function(row) {
                var displays = row.displays;
                var bestIndices = getBestIndices(row.values, row.spec.compare);

                html += '<tr><td>' + row.spec.label + '</td>';
                boards.forEach(function(board, i) {
                    var cls = bestIndices.indexOf(i) !== -1 ? ' class="highlight"' : '';
                    html += '<td' + cls + '>' + displays[i] + '</td>';
                });
                html += '</tr>';
            });

            html += '<tr><td>Price</td>';
            boards.forEach(function(board) {
                if (board) {
                    html += '<td><a href="' + getAmazonUrl(board) + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="font-size:0.75rem;padding:0.3rem 0.75rem;">Check Price</a></td>';
                } else {
                    html += '<td>--</td>';
                }
            });
            html += '</tr>';

            html += '</tbody></table>';
            compareTableWrap.innerHTML = html;
        }

        // Preselect from the URL before the first paint. No syncUrl() here:
        // arriving at a bare compare.html must not rewrite the address bar.
        const urlSelection = selectionFromUrl();
        if (urlSelection) selectedBoards = urlSelection;

        renderSlots();
        renderTable();
    }


    // --------------------------------------------------------
    // 7. GUIDE PAGE - TABLE OF CONTENTS
    // --------------------------------------------------------

    const guideToc = document.querySelector('.guide-toc');

    if (guideToc) {
        const tocLinks = guideToc.querySelectorAll('a');
        const guideHeadings = document.querySelectorAll('h2[id]');

        if (guideHeadings.length > 0 && tocLinks.length > 0) {
            const tocObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');

                        tocLinks.forEach(link => {
                            link.classList.remove('active');
                            const href = link.getAttribute('href');
                            if (href === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, {
                rootMargin: '-10% 0px -80% 0px',
                threshold: 0
            });

            guideHeadings.forEach(heading => tocObserver.observe(heading));
        }
    }


    // --------------------------------------------------------
    // 8. SMOOTH SCROLL for Anchor Links
    // --------------------------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');

            // Ignore empty hashes and non-element selectors
            if (!targetId || targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth' });

                // Update URL hash without jumping
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        });
    });

});


/* ============================================================
   9. GLOSSARY TOOLTIPS
   Marks jargon inside spec tables with a short definition shown
   on hover, tap or keyboard focus. Progressive enhancement:
   with JS off the tables render exactly as the HTML ships them.
   ============================================================ */

(function (global) {
    'use strict';

    var VRM_GUIDE = 'guide-cooling.html#vrm-heatsinks';
    var VRM_GUIDE_LABEL = 'VRM cooling guide';
    var RAM_GUIDE = 'guide-ram.html#ddr4-vs-ddr5';
    var RAM_GUIDE_LABEL = 'DDR4 vs DDR5 guide';
    var DDR_SLOTS = 'DDR4 and DDR5 slots are physically incompatible, so a board takes one or the other.';

    var TERMS = [
        {
            id: 'vrm',
            label: 'VRM',
            pattern: /\bVRMs?\b/,
            definition: "The voltage regulator module steps the power supply's 12V rail down to the much lower voltage a CPU runs on. It works harder and runs hotter the more power the CPU draws.",
            guide: VRM_GUIDE,
            guideLabel: VRM_GUIDE_LABEL
        },
        {
            id: 'power-phases',
            label: 'Power phases',
            pattern: /\b\d{1,2}\+\d{1,2}(?:\+\d{1,2})?\b/,
            definition: 'Each phase is one stage of the VRM circuit that shares the work of stepping 12V down for the processor. A count like 14+2+1 groups the phases by what they feed: the CPU cores first, then the SoC or integrated graphics, then smaller rails.',
            guide: VRM_GUIDE,
            guideLabel: VRM_GUIDE_LABEL
        },
        {
            id: 'alc',
            label: 'Realtek ALC codec',
            pattern: /\bALC\d{3,4}\b/,
            definition: 'The model number of the Realtek codec chip that turns digital audio into the analog signal headphones and speakers need. A higher number means a newer part, not automatically better sound.'
        },
        {
            id: 'pcie',
            label: 'PCIe',
            pattern: /\bPCIe\b/,
            definition: 'PCI Express is the high-speed bus that connects graphics cards and NVMe drives to the CPU and chipset. The number after the x is how many lanes a slot carries, and each generation doubles the bandwidth per lane.',
            guide: 'guide-pcie.html#what-is-pcie',
            guideLabel: 'PCIe guide'
        },
        {
            id: 'm2',
            label: 'M.2',
            pattern: /\bM\.2\b/,
            definition: 'M.2 is the slot standard for the small, stick-shaped SSDs that mount flat on the board. Most M.2 slots run NVMe drives over PCIe lanes.',
            guide: 'guide-storage.html#m2-nvme',
            guideLabel: 'M.2 and NVMe guide'
        },
        {
            id: 'wifi',
            label: 'WiFi',
            pattern: /\bWiFi(?:\s?(?:6E|7|6|5))?\b/,
            definition: 'The wireless networking standard the onboard adapter supports. WiFi 6E and WiFi 7 can also use the 6GHz band, which is usually less crowded than 2.4GHz and 5GHz.'
        },
        {
            id: 'bluetooth',
            label: 'Bluetooth',
            pattern: /\bBT\s?\d(?:\.\d)?\b/,
            definition: "BT is the Bluetooth version of the board's wireless module, used for controllers, headsets and other peripherals. Later versions add range and low-energy features."
        },
        {
            id: 'lan',
            label: 'Ethernet speed',
            pattern: /\b(?:10G|5G|2\.5G|1G)\b/,
            definition: "The top speed of the board's wired Ethernet port in gigabits per second. The router or switch at the other end has to support the same speed for it to help."
        },
        {
            id: 'memory-profile',
            label: 'EXPO / XMP',
            pattern: /\b(?:EXPO|XMP)\b/,
            definition: "Stored profiles that let a memory kit run at its rated speed instead of the slower default, switched on with one BIOS setting. EXPO is AMD's version and XMP is Intel's.",
            guide: 'guide-ram.html#xmp-expo',
            guideLabel: 'XMP and EXPO guide'
        },
        {
            id: 'mini-itx',
            label: 'Mini-ITX',
            pattern: /\bMini-?ITX\b/,
            definition: 'The smallest mainstream board size at 170 x 170mm, built for small-form-factor cases. Space is tight, so it trades expansion room for size.',
            guide: 'guide-cases.html#mini-itx',
            guideLabel: 'Mini-ITX guide'
        },
        {
            id: 'micro-atx',
            label: 'Micro-ATX',
            pattern: /\bMicro-?ATX\b/,
            definition: 'A 244 x 244mm board, as wide as ATX but shorter and with fewer expansion slots. It fits Micro-ATX cases and most full-size ATX ones.',
            guide: 'guide-cases.html#micro-atx',
            guideLabel: 'Micro-ATX guide'
        },
        {
            id: 'atx',
            label: 'ATX',
            pattern: /\bATX\b/,
            definition: 'The full-size desktop board standard at 305 x 244mm, with the most expansion slots and headers. The case has to be rated for ATX to take one.',
            guide: 'guide-cases.html#atx',
            guideLabel: 'ATX guide'
        },
        {
            id: 'ddr5',
            label: 'DDR5',
            pattern: /\bDDR5\b/,
            definition: 'The current desktop memory generation, running at higher speeds than DDR4 and managing its own power on the module. ' + DDR_SLOTS,
            guide: RAM_GUIDE,
            guideLabel: RAM_GUIDE_LABEL
        },
        {
            id: 'ddr4',
            label: 'DDR4',
            pattern: /\bDDR4\b/,
            definition: 'The previous desktop memory generation, slower than DDR5 but cheaper per gigabyte. ' + DDR_SLOTS,
            guide: RAM_GUIDE,
            guideLabel: RAM_GUIDE_LABEL
        }
    ];

    var CELL_SELECTOR = '.spec-table td, .compare-table td, .compare-table-wrap td';

    var tipCount = 0;

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // All matches in `text`, longest first at any position, one per term.
    function findMatches(text) {
        var hits = [];

        TERMS.forEach(function (term) {
            var re = new RegExp(term.pattern.source, 'g');
            var match;
            while ((match = re.exec(text)) !== null) {
                hits.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    term: term
                });
            }
        });

        hits.sort(function (a, b) {
            return (a.start - b.start) || ((b.end - b.start) - (a.end - a.start));
        });

        var kept = [];
        var marked = {};
        var cursor = 0;

        hits.forEach(function (hit) {
            if (hit.start < cursor) return;                       // inside a longer match
            if (marked[hit.term.id]) return;                      // one mark per term per cell
            if (hit.start > 0 && text.charAt(hit.start - 1) === '-') return;  // E-ATX, not ATX
            marked[hit.term.id] = true;
            cursor = hit.end;
            kept.push(hit);
        });

        return kept;
    }

    function markup(hit) {
        var term = hit.term;
        var tipId = 'glossary-tip-' + term.id + '-' + (++tipCount);
        var body = escapeHTML(term.definition);

        if (term.guide) {
            body += ' <a class="glossary-tip-link" href="' + escapeHTML(term.guide) + '">' +
                escapeHTML(term.guideLabel) + '</a>';
        }

        return '<span class="glossary">' +
            '<button type="button" class="glossary-term" aria-describedby="' + tipId +
            '" aria-expanded="false">' + escapeHTML(hit.text) + '</button>' +
            '<span class="glossary-tip" role="tooltip" id="' + tipId + '">' +
            '<span class="glossary-tip-label">' + escapeHTML(term.label) + '</span> ' +
            body + '</span></span>';
    }

    // Returns annotated HTML, or null when the text holds no known term.
    function annotate(text) {
        var hits = findMatches(text);
        if (!hits.length) return null;

        var html = '';
        var pos = 0;

        hits.forEach(function (hit) {
            html += escapeHTML(text.slice(pos, hit.start)) + markup(hit);
            pos = hit.end;
        });

        return html + escapeHTML(text.slice(pos));
    }

    function enhance(root) {
        var scope = root || global.document;
        var cells = scope.querySelectorAll(CELL_SELECTOR);
        var changed = 0;

        Array.prototype.forEach.call(cells, function (cell) {
            if (cell.dataset.glossary === 'done') return;
            if (cell.children.length) return;                     // leave markup alone

            var html = annotate(cell.textContent);
            if (!html) return;

            cell.innerHTML = html;
            cell.dataset.glossary = 'done';
            changed++;
        });

        return changed;
    }

    var EDGE = 8;   // keep this far clear of the viewport edge
    var GAP = 6;    // gap between the term and its tooltip

    // Viewport coordinates for a tooltip anchored under `anchorRect`.
    function tipPosition(anchorRect, tipSize, viewport) {
        var left = anchorRect.left + (anchorRect.width / 2) - (tipSize.width / 2);
        var maxLeft = viewport.width - tipSize.width - EDGE;
        left = Math.max(EDGE, Math.min(left, Math.max(EDGE, maxLeft)));

        var top = anchorRect.bottom + GAP;
        if (top + tipSize.height > viewport.height - EDGE) {
            top = anchorRect.top - tipSize.height - GAP;   // flip above
        }
        top = Math.max(EDGE, top);

        return { left: left, top: top };
    }

    function place(wrap) {
        var doc = global.document;
        var term = wrap.querySelector('.glossary-term');
        var tip = wrap.querySelector('.glossary-tip');
        if (!term || !tip) return;

        var pos = tipPosition(
            term.getBoundingClientRect(),
            { width: tip.offsetWidth, height: tip.offsetHeight },
            {
                width: global.innerWidth || doc.documentElement.clientWidth,
                height: global.innerHeight || doc.documentElement.clientHeight
            }
        );

        tip.style.left = pos.left + 'px';
        tip.style.top = pos.top + 'px';
    }

    function open(wrap) {
        wrap.classList.add('is-open');
        var term = wrap.querySelector('.glossary-term');
        if (term) term.setAttribute('aria-expanded', 'true');
        place(wrap);
    }

    function closeAll(doc, except) {
        Array.prototype.forEach.call(doc.querySelectorAll('.glossary.is-open'), function (el) {
            if (el === except) return;
            el.classList.remove('is-open');
            var term = el.querySelector('.glossary-term');
            if (term) term.setAttribute('aria-expanded', 'false');
        });
    }

    function wrapOf(node) {
        return node && node.closest ? node.closest('.glossary') : null;
    }

    function init() {
        var doc = global.document;
        if (!doc) return;

        enhance(doc);

        // compare.html rebuilds its table after load, so re-run on DOM changes.
        if (typeof global.MutationObserver === 'function' && doc.body) {
            var pending = false;
            var observer = new global.MutationObserver(function () {
                if (pending) return;
                pending = true;
                global.setTimeout(function () {
                    pending = false;
                    enhance(doc);
                }, 0);
            });
            observer.observe(doc.body, { childList: true, subtree: true });
        }

        // Hover, mouse only - touch is handled by the click below.
        doc.addEventListener('pointerover', function (event) {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            var wrap = wrapOf(event.target);
            if (!wrap) {
                closeAll(doc, wrapOf(doc.activeElement));   // leave a focused one open
                return;
            }
            closeAll(doc, wrap);
            open(wrap);
        });

        doc.addEventListener('pointerout', function (event) {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            var wrap = wrapOf(event.target);
            if (!wrap || wrapOf(event.relatedTarget) === wrap) return;
            if (wrap.contains(doc.activeElement)) return;   // keyboard focus is inside
            closeAll(doc, wrapOf(doc.activeElement));
        });

        // Tap to open, tap away to close.
        doc.addEventListener('click', function (event) {
            var term = event.target.closest ? event.target.closest('.glossary-term') : null;

            if (!term) {
                if (!wrapOf(event.target)) closeAll(doc);
                return;
            }

            var wrap = term.parentNode;
            if (event.detail === 0) return;   // keyboard activation, focus already opened it

            var wasOpen = wrap.classList.contains('is-open');
            closeAll(doc);
            if (!wasOpen) open(wrap);
        });

        // Keyboard: focus opens, Esc closes.
        doc.addEventListener('focusin', function (event) {
            var wrap = wrapOf(event.target);
            closeAll(doc, wrap);
            if (wrap) open(wrap);
        });

        doc.addEventListener('focusout', function (event) {
            var wrap = wrapOf(event.target);
            if (!wrap || wrapOf(event.relatedTarget) === wrap) return;
            closeAll(doc);
        });

        doc.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' || event.key === 'Esc') closeAll(doc);
        });

        // Keep an open tooltip pinned to its term.
        var reposition = function () {
            Array.prototype.forEach.call(doc.querySelectorAll('.glossary.is-open'), place);
        };
        global.addEventListener('scroll', reposition, true);
        global.addEventListener('resize', reposition);
    }

    global.MBCGlossary = {
        TERMS: TERMS,
        CELL_SELECTOR: CELL_SELECTOR,
        annotate: annotate,
        enhance: enhance,
        tipPosition: tipPosition,
        init: init
    };

    if (global.document && global.document.addEventListener) {
        global.document.addEventListener('DOMContentLoaded', init);
    }
})(typeof window !== 'undefined' ? window : this);
