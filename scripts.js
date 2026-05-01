// ─── COPYRIGHT YEAR ───
document.getElementById('copyright-year').textContent = new Date().getFullYear();

// ─── NAV SCROLL ───
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ─── MOBILE MENU ───
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── NAV ACTIVE (scroll + hash) ───
const NAV_SECTION_IDS = ['experience', 'events', 'story', 'news', 'voices', 'gallery', 'visit', 'connect'];

function setNavActiveById(id) {
    navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
        const href = link.getAttribute('href');
        const match = href === `#${id}`;
        link.classList.toggle('active', match && id !== '');
    });
}

function updateNavActiveFromScroll() {
    const navHeight = nav.offsetHeight;
    const line = window.scrollY + navHeight + 32;
    let activeId = '';
    for (const sectionId of NAV_SECTION_IDS) {
        const el = document.getElementById(sectionId);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (line >= top) activeId = sectionId;
    }
    setNavActiveById(activeId);
}

let navActiveRaf = 0;
function scheduleNavActive() {
    if (navActiveRaf) return;
    navActiveRaf = requestAnimationFrame(() => {
        navActiveRaf = 0;
        updateNavActiveFromScroll();
    });
}

window.addEventListener('scroll', scheduleNavActive, { passive: true });
window.addEventListener('resize', scheduleNavActive, { passive: true });
window.addEventListener('load', () => {
    const hash = window.location.hash.slice(1);
    if (hash && NAV_SECTION_IDS.includes(hash)) {
        setNavActiveById(hash);
    } else {
        updateNavActiveFromScroll();
    }
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && NAV_SECTION_IDS.includes(hash)) {
        setNavActiveById(hash);
    } else {
        updateNavActiveFromScroll();
    }
});

navLinks.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if (!id || !NAV_SECTION_IDS.includes(id)) return;
    a.addEventListener('click', () => {
        setNavActiveById(id);
    });
});

// ─── EMAIL SIGNUP MODAL ───
const signupModal = document.getElementById('signup-modal');
const modalClose = document.getElementById('modalClose');

function openSignupModal() {
    signupModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSignupModal() {
    signupModal.classList.remove('open');
    document.body.style.overflow = '';
}

document.querySelectorAll('[data-modal="signup"]').forEach(trigger => {
    trigger.addEventListener('click', e => {
        e.preventDefault();
        openSignupModal();
    });
});

modalClose.addEventListener('click', closeSignupModal);

// Close on backdrop click
signupModal.addEventListener('click', e => {
    if (e.target === signupModal) closeSignupModal();
});

// Close on Escape key
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && signupModal.classList.contains('open')) closeSignupModal();
});

// ─── SCROLL REVEAL ───
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
    });
}, {
    threshold: 0.1
});
reveals.forEach(el => observer.observe(el));

// ─── BEHOLD INSTAGRAM (lazy load) ───
// Loads widget.js only when #gallery is near the viewport. Console messages from
// Behold / Google (maps beacon, unload policy, logger) are third-party, not this file.
(function loadBeholdWhenVisible() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    function injectBeholdScript() {
        if (document.querySelector('script[data-behold-widget]')) return;
        const s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://w.behold.so/widget.js';
        s.dataset.beholdWidget = 'true';
        document.head.appendChild(s);
    }

    if (!('IntersectionObserver' in window)) {
        injectBeholdScript();
        return;
    }

    const io = new IntersectionObserver(
        (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                io.disconnect();
                injectBeholdScript();
            }
        },
        { rootMargin: '240px 0px', threshold: 0 }
    );
    io.observe(gallery);
})();

const EVENTS_CONFIG = {
  sheetCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRUmQvfrstq2LAgQnJMxxBDyHKQmKOFccBau4Wga2fK-QjH4O06DFuNm6gqyO5r5tR-BD9dI2J7EU66/pub?gid=837054704&single=true&output=csv", // ← PASTE PUBLISHED CSV URL HERE
  maxEvents: 12, // Max events to display
};


async function loadEventsFromSheet() {
    const gridEl = document.getElementById('events-grid');
    const loadingEl = document.getElementById('events-loading');
    const staticEl = document.getElementById('events-static');

    // Not configured — show static fallback, hide loader
    if (!EVENTS_CONFIG.sheetCsvUrl) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (staticEl) staticEl.style.display = 'grid';
        return;
    }

    try {
        const cacheBust = `${EVENTS_CONFIG.sheetCsvUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
        const res = await fetch(EVENTS_CONFIG.sheetCsvUrl + cacheBust, {cache: "no-store",});
        if (!res.ok) throw new Error(`Sheet fetch ${res.status}`);

        const text = await res.text();
        const events = parseCsvToEvents(text);

        if (!events.length) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (staticEl) staticEl.style.display = 'grid';
            return;
        }

        // Build event cards
        const grid = document.createElement('div');
        grid.className = 'events-grid';

        events.slice(0, EVENTS_CONFIG.maxEvents).forEach(evt => {
            // Column H: "image" — supports a URL, an emoji, or blank
            const imgValue = evt.image || evt.emoji || '';
            const isUrl = imgValue.startsWith('http');
            const cardImgContent = isUrl
                ? `<img src="${imgValue}" alt="${evt.title}" loading="lazy">`
                : (imgValue || '🍷');

            const status = evt.status || 'upcoming';
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
            const hasLink = evt.link || evt.link_label;
            const linkLabel = evt.link_label || 'Get Your Tickets';
            const linkHref = evt.link || '#';
            const linkTarget = evt.link ? ' target="_blank" rel="noopener"' : '';
            const linkHtml = hasLink
                ? `<a href="${linkHref}"${linkTarget} class="event-card-link">${linkLabel} →</a>`
                : '';

            grid.innerHTML += `
                <div class="event-card">
                    <div class="event-card-img">${cardImgContent}</div>
                    <div class="event-card-body">
                        <div class="event-card-date">${evt.date}${evt.time ? ' · ' + evt.time : ''}</div>
                        <h4 class="event-card-title">${evt.title}</h4>
                        <p class="event-card-desc">${evt.description}</p>
                        <div class="event-card-footer">
                            <span class="event-card-status ${status.replace(/\s+/g, '-')}">${statusLabel}</span>
                            ${linkHtml}
                        </div>
                    </div>
                </div>`;
        });

        // Swap: hide loader and static, show dynamic grid
        if (loadingEl) loadingEl.style.display = 'none';
        if (staticEl) staticEl.style.display = 'none';
        if (gridEl) {
            gridEl.innerHTML = '';
            gridEl.appendChild(grid);
        } else {
            // If there's no #events-grid wrapper, insert before the CTA
            const eventsSection = document.getElementById('events');
            const ctaWrap = eventsSection.querySelector('.events-cta-wrap');
            if (ctaWrap) eventsSection.insertBefore(grid, ctaWrap);
        }

    } catch (err) {
        console.warn('Events sheet fetch failed:', err);
        if (loadingEl) loadingEl.style.display = 'none';
        if (staticEl) staticEl.style.display = 'grid';
    }
}

/**
 * Parse CSV text into an array of event objects.
 * Handles quoted fields with commas and newlines.
 */
function parseCsvToEvents(csvText) {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return []; // Need header + at least 1 data row

    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const events = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.length || row.every(cell => !cell.trim())) continue; // Skip empty rows

        const evt = {};
        headers.forEach((h, idx) => {
            evt[h] = (row[idx] || '').trim();
        });

        // Require at minimum a title
        if (evt.title) events.push(evt);
    }

    return events;
}

/**
 * Robust CSV row parser that handles quoted fields.
 */
function parseCsvRows(text) {
    const rows = [];
    let current = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                field += '"';
                i++; // Skip escaped quote
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                field += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                current.push(field);
                field = '';
            } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
                current.push(field);
                field = '';
                rows.push(current);
                current = [];
                if (ch === '\r') i++; // Skip \n in \r\n
            } else if (ch === '\r') {
                current.push(field);
                field = '';
                rows.push(current);
                current = [];
            } else {
                field += ch;
            }
        }
    }

    // Last field/row
    if (field || current.length) {
        current.push(field);
        rows.push(current);
    }

    return rows;
}

loadEventsFromSheet();

