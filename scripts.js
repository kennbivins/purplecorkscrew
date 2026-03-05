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

// ═══════════════════════════════════════════════════════════════
//  EVENTBRITE AUTO-FEED INTEGRATION
// ═══════════════════════════════════════════════════════════════
//
//  HOW TO CONNECT:
//
//  1. Go to https://www.eventbrite.com/platform/api-keys
//     → Create a free API key. Copy the "Private token."
//
//  2. Find Purple Corkscrew's Organizer ID:
//     → Log in to Eventbrite
//     → Go to Settings → Organization Settings
//     → The numeric ID is in the URL bar
//
//  3. Set the Eventbrite public profile URL below
//     (e.g. https://www.eventbrite.com/o/purple-corkscrew-12345678)
//
//  4. Fill in the 3 values in EB_CONFIG below.
//
//  Once set, events auto-populate from Eventbrite on every page load.
//  No manual updates needed — add/edit events in Eventbrite as usual.
//
//  ⚠ SECURITY NOTE: The token is visible in client-side code.
//  This is fine for read-only public event data. For stricter security,
//  wrap this in a Cloudflare Worker or Netlify Function (ask Kenn!).
//
//  ALTERNATIVE (no API key needed):
//  Use Eventbrite's built-in "Embedded Checkout" instead.
//  In each event's dashboard → Marketing → Embedded Checkout
//  → Copy the embed code snippet → Paste inside #eventbrite-feed div.
//  This gives you a per-event embed button but won't auto-pull new events.
//
// ═══════════════════════════════════════════════════════════════

const EB_CONFIG = {
    token: '', // ← PASTE OAUTH TOKEN HERE
    organizerId: '', // ← PASTE ORGANIZER ID HERE
    profileUrl: '#', // ← PASTE PUBLIC EVENTBRITE URL HERE
    maxEvents: 3
};

document.getElementById('eventbrite-link').href = EB_CONFIG.profileUrl;

async function loadEventbriteEvents() {
    const loadingEl = document.getElementById('events-loading');
    const staticEl = document.getElementById('events-static');
    const feedEl = document.getElementById('eventbrite-feed');

    // No token? Show static fallback cards instead.
    if (!EB_CONFIG.token || !EB_CONFIG.organizerId) {
        loadingEl.style.display = 'none';
        staticEl.style.display = 'grid';
        return;
    }

    try {
        const res = await fetch(
            `https://www.eventbriteapi.com/v3/organizations/${EB_CONFIG.organizerId}/events/?status=live&order_by=start_asc&expand=venue,logo`, {
                headers: {
                    'Authorization': `Bearer ${EB_CONFIG.token}`
                }
            }
        );
        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        const events = (data.events || []).slice(0, EB_CONFIG.maxEvents);

        if (!events.length) {
            loadingEl.style.display = 'none';
            staticEl.style.display = 'grid';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'events-grid';

        events.forEach(evt => {
            const start = new Date(evt.start.local);
            const dateStr = start.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            const imgHtml = (evt.logo && evt.logo.url) ?
                `<img src="${evt.logo.url}" alt="${evt.name.text}" loading="lazy">` :
                '🍷';

            const desc = evt.summary ||
                (evt.description && evt.description.text ?
                    evt.description.text.substring(0, 150) + '…' :
                    'Join us for this upcoming event at Purple Corkscrew.');

            const statusClass = evt.is_free ? 'free' : 'upcoming';
            const statusLabel = evt.is_free ? 'Free' : 'Tickets Available';

            grid.innerHTML += `
  <div class="event-card">
    <div class="event-card-img">${imgHtml}</div>
    <div class="event-card-body">
      <div class="event-card-date">${dateStr} · ${timeStr}</div>
      <h4 class="event-card-title"><a href="${evt.url}" target="_blank" rel="noopener">${evt.name.text}</a></h4>
      <p class="event-card-desc">${desc}</p>
      <div class="event-card-footer">
        <span class="event-card-status ${statusClass}">${statusLabel}</span>
        <a href="${evt.url}" target="_blank" rel="noopener" class="event-card-link">Get Tickets →</a>
      </div>
    </div>
  </div>`;
        });

        loadingEl.style.display = 'none';
        feedEl.appendChild(grid);

    } catch (err) {
        console.warn('Eventbrite fetch failed:', err);
        loadingEl.style.display = 'none';
        staticEl.style.display = 'grid';
    }
}

loadEventbriteEvents();
