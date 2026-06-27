/* =========================================
   MBOPHA SECONDARY SCHOOL — MAIN JAVASCRIPT
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. NAVBAR SCROLL EFFECT
       ========================================= */
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        const applyScrolled = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        };
        applyScrolled(); // Run on load in case page is already scrolled
        window.addEventListener('scroll', applyScrolled, { passive: true });
    }

    /* =========================================
       2. MOBILE MENU TOGGLE
       ========================================= */
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');

    const closeMenu = () => {
        if (!navLinks) return;
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
        if (hamburger) {
            hamburger.innerHTML = '☰';
            hamburger.setAttribute('aria-expanded', 'false');
        }
    };

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open', isOpen);
            hamburger.innerHTML = isOpen ? '✕' : '☰';
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        // Close when any nav link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        // Close when clicking outside the menu
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !hamburger.contains(e.target)) {
                closeMenu();
            }
        });
    }

    /* =========================================
       3. SCROLL REVEAL (IntersectionObserver)
       ========================================= */
    // NOTE: .reveal-item is now hardcoded directly on elements in the HTML
    // (rather than injected here) so they start hidden on first paint with
    // no flash of unstyled content. This script only adds .revealed once
    // an element scrolls into view.
    const REVEAL_SELECTOR = '.reveal-item';

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
            revealObserver.observe(el);
        });
    } else {
        // Skip animation — show everything immediately
        document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
            el.classList.add('revealed');
        });
    }

    /* =========================================
       4. STATS COUNT-UP ANIMATION
       ========================================= */
    const statsSection = document.querySelector('.stats');
    const statNumbers  = document.querySelectorAll('.stat-card .number');

    if (statsSection && statNumbers.length > 0 && !prefersReduced) {
        let hasCounted = false;

        const statsObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasCounted) {
                    hasCounted = true;
                    obs.disconnect();

                    statNumbers.forEach(stat => {
                        const target    = +stat.getAttribute('data-target');
                        const suffix    = stat.getAttribute('data-suffix') || '';
                        const duration  = 2000; // ms
                        const fps       = 60;
                        const steps     = duration / (1000 / fps);
                        const increment = target / steps;
                        let current     = 0;

                        const tick = () => {
                            current += increment;
                            if (current < target) {
                                stat.textContent = Math.ceil(current) + suffix;
                                requestAnimationFrame(tick);
                            } else {
                                stat.textContent = target + suffix;
                            }
                        };
                        requestAnimationFrame(tick);
                    });
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    } else if (statNumbers.length > 0) {
        // Show final values immediately for reduced-motion users
        statNumbers.forEach(stat => {
            const target = stat.getAttribute('data-target');
            const suffix = stat.getAttribute('data-suffix') || '';
            stat.textContent = target + suffix;
        });
    }

    /* =========================================
       5. FORM VALIDATION & NETLIFY SUBMISSION
       ========================================= */
    document.querySelectorAll('form[data-netlify="true"]').forEach(form => {

        // Live error-clearing on input
        form.querySelectorAll('.form-control').forEach(field => {
            field.addEventListener('input', () => {
                field.classList.remove('error');
                // Clear associated error message if present
                const errMsg = field.parentElement.querySelector('.field-error');
                if (errMsg) errMsg.remove();
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // --- Validate ---
            let isValid = true;
            form.querySelectorAll('[required]').forEach(field => {
                const empty = !field.value.trim();
                const isEmail = field.type === 'email';
                const badEmail = isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());

                if (empty || badEmail) {
                    isValid = false;
                    field.classList.add('error');

                    // Inject inline error text if not already there
                    if (!field.parentElement.querySelector('.field-error')) {
                        const msg = document.createElement('span');
                        msg.className = 'field-error';
                        msg.textContent = empty ? 'This field is required.' : 'Please enter a valid email address.';
                        field.insertAdjacentElement('afterend', msg);
                    }
                } else {
                    field.classList.remove('error');
                }
            });

            if (!isValid) {
                // Focus the first invalid field for accessibility
                const firstError = form.querySelector('.form-control.error');
                if (firstError) firstError.focus();
                return;
            }

            // --- Submit ---
            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams(new FormData(form)).toString()
                });

                if (response.ok) {
                    const successMsg = form.querySelector('.success-message');
                    if (successMsg) {
                        successMsg.style.display = 'block';
                        successMsg.focus(); // Move focus for screen readers
                    }
                    form.reset();
                    setTimeout(() => {
                        if (successMsg) successMsg.style.display = 'none';
                    }, 6000);
                } else {
                    throw new Error(`Server responded with ${response.status}`);
                }
            } catch (err) {
                console.error('Form submission error:', err);
                const errDiv = form.querySelector('.error-message') || (() => {
                    const d = document.createElement('div');
                    d.className = 'error-message';
                    form.prepend(d);
                    return d;
                })();
                errDiv.textContent = 'Submission failed. Please try again or contact us directly.';
                errDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    });

    /* =========================================
       6. ACTIVE NAV LINK (auto-highlight)
       ========================================= */
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkPage = link.getAttribute('href');
        // Don't override manually set .active or mark the CTA button
        if (!link.classList.contains('btn') && linkPage === currentPage) {
            link.classList.add('active');
        }
    });

    /* =========================================
       7. SITE SEARCH (Overlay + Simple Index)
       ========================================= */
    const SEARCH_INDEX = [
        { title: 'Home', url: 'index.html', excerpt: 'Mbopha Secondary School homepage — empowering learners, building futures.', keywords: 'home welcome enrolled learners educators pass rate stats' },
        { title: 'About Us', url: 'about.html', excerpt: "Our history, vision, mission and principal's message.", keywords: 'about history vision mission principal staff sgb story established 1976' },
        { title: 'Academics', url: 'academics.html', excerpt: 'Subjects, streams and academic programmes offered.', keywords: 'academics subjects commerce stream physical science maths curriculum programmes' },
        { title: 'Admissions', url: 'admissions.html', excerpt: 'Grade 8 applications, requirements and how to apply.', keywords: 'admissions apply application grade 8 enrol enrolment requirements fees' },
        { title: 'Gallery', url: 'gallery.html', excerpt: 'Photos of school life — assemblies, classrooms, sports and events.', keywords: 'gallery photos pictures images assembly classroom sports awards events' },
        { title: 'Downloads', url: 'downloads.html', excerpt: 'School forms, policies and documents available to download.', keywords: 'downloads forms documents policy pdf files' },
        { title: 'Calendar', url: 'calendar.html', excerpt: 'Academic calendar, term dates and key school events.', keywords: 'calendar dates terms events academic year schedule' },
        { title: 'News', url: 'news.html', excerpt: 'Latest news and announcements from the school.', keywords: 'news announcements updates matric results admissions open website launch' },
        { title: 'Contact', url: 'contact.html', excerpt: 'Get in touch — phone, email, address and a contact form.', keywords: 'contact phone email address map location enquiry whatsapp' },
    ];

    const searchToggle  = document.querySelector('.search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose   = document.querySelector('.search-close');
    const searchForm    = document.getElementById('search-form');
    const searchInput   = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    const renderResults = (query) => {
        if (!searchResults) return;
        const q = query.trim().toLowerCase();
        searchResults.innerHTML = '';

        if (!q) return;

        const matches = SEARCH_INDEX.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.keywords.toLowerCase().includes(q) ||
            item.excerpt.toLowerCase().includes(q)
        );

        if (matches.length === 0) {
            const li = document.createElement('li');
            li.className = 'search-no-results';
            li.textContent = `No results for "${query}". Try "admissions", "calendar" or "contact".`;
            searchResults.appendChild(li);
            return;
        }

        matches.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.url;
            a.innerHTML = `<span class="result-title">${item.title}</span><span class="result-excerpt">${item.excerpt}</span>`;
            li.appendChild(a);
            searchResults.appendChild(li);
        });
    };

    const openSearch = () => {
        if (!searchOverlay) return;
        closeMenu();
        searchOverlay.classList.add('active');
        document.body.classList.add('search-open');
        searchToggle.setAttribute('aria-expanded', 'true');
        setTimeout(() => searchInput && searchInput.focus(), 50);
    };

    const closeSearch = () => {
        if (!searchOverlay) return;
        searchOverlay.classList.remove('active');
        document.body.classList.remove('search-open');
        if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
    };

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', openSearch);
        if (searchClose) searchClose.addEventListener('click', closeSearch);

        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) closeSearch();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) closeSearch();
        });

        if (searchInput) {
            searchInput.addEventListener('input', () => renderResults(searchInput.value));
        }

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = searchInput.value.trim().toLowerCase();
                const topMatch = SEARCH_INDEX.find(item =>
                    item.title.toLowerCase().includes(q) ||
                    item.keywords.toLowerCase().includes(q)
                );
                if (topMatch) window.location.href = topMatch.url;
            });
        }
    }

    /* =========================================
       8. GALLERY CATEGORY FILTER
       ========================================= */
    const filterBtns   = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const emptyState   = document.getElementById('gallery-empty-state');

    if (filterBtns.length > 0 && galleryItems.length > 0) {
        // Set initial aria-pressed state
        filterBtns.forEach(btn => {
            btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');

                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                let visibleCount = 0;
                galleryItems.forEach(item => {
                    const match = filter === 'all' || item.getAttribute('data-category') === filter;
                    item.classList.toggle('hidden', !match);
                    if (match) visibleCount++;
                });

                if (emptyState) emptyState.hidden = visibleCount > 0;
            });
        });
    }

});
