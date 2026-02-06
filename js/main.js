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

        let selectedBoards = [null, null];

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
                if (selectedBoards.length > 2) {
                    html += '<button class="compare-remove-btn" data-slot="' + slotIdx + '" title="Remove">&times;</button>';
                }
                html += '</div>';
            });

            if (selectedBoards.length < 5) {
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
                    renderSlots();
                    renderTable();
                });
            });

            compareSlots.querySelectorAll('.compare-remove-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var slot = parseInt(e.target.dataset.slot);
                    selectedBoards.splice(slot, 1);
                    renderSlots();
                    renderTable();
                });
            });

            var addBtn = document.getElementById('add-board-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    selectedBoards.push(null);
                    renderSlots();
                });
            }
        }

        function renderTable() {
            var boards = selectedBoards.map(function(idx) {
                return idx !== null ? motherboardDatabase[idx] : null;
            });
            var anySelected = boards.some(function(b) { return b !== null; });

            if (!anySelected) {
                compareTableWrap.innerHTML = '<div class="compare-placeholder"><p>Select motherboards above to compare specifications side-by-side.</p></div>';
                return;
            }

            var html = '<table><thead><tr><th>Specification</th>';
            boards.forEach(function(board) {
                html += '<th>' + (board ? board.name : '--') + '</th>';
            });
            html += '</tr></thead><tbody>';

            specRows.forEach(function(spec) {
                var values = boards.map(function(b) { return b ? b[spec.key] : null; });
                var displays = boards.map(function(b) {
                    if (!b) return '--';
                    return spec.format ? spec.format(b[spec.key]) : b[spec.key];
                });
                var bestIndices = getBestIndices(values, spec.compare);

                html += '<tr><td>' + spec.label + '</td>';
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
