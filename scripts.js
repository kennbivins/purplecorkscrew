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


// ═══════════════════════════════════════════════════════════════
//  INSTAGRAM GALLERY INTEGRATION (Optional — DIY approach)
// ═══════════════════════════════════════════════════════════════
//
//  The Gallery section supports two approaches:
//
//  ─────────────────────────────────────────────────────────────
//  OPTION A — Third-party widget (RECOMMENDED)
//  ─────────────────────────────────────────────────────────────
//
//  Use Behold (https://behold.so), EmbedSocial, or Elfsight.
//
//  1. Sign up → connect @purplecorkscrewwine
//  2. Choose a layout (grid, masonry, slider, etc.)
//  3. Copy the <script> embed snippet they provide
//  4. Paste it inside the <div id="instagram-feed"> in index.html
//  5. The static fallback grid auto-hides via CSS when the
//     widget renders content into #instagram-feed
//
//  Behold free tier: 1 feed, 12 posts, auto-syncs. No tokens.
//
//  ─────────────────────────────────────────────────────────────
//  OPTION B — Instagram Basic Display API (DIY)
//  ─────────────────────────────────────────────────────────────
//
//  If you want full control over the gallery UI, use the
//  Instagram API directly. Steps:
//
//  1. Create a Meta developer app at developers.facebook.com
//  2. Add "Instagram Basic Display" product
//  3. Generate a long-lived user access token
//  4. Paste it below in IG_CONFIG.token
//  5. The code below will fetch posts and render them
//
//  ⚠ Token expires every 60 days — set a calendar reminder
//     to refresh it, or automate via a serverless function.
//
//  ⚠ The token is visible in client-side JS. For read-only
//     public media this is acceptable. For tighter security,
//     proxy through a Cloudflare Worker or Netlify Function.
//
// ═══════════════════════════════════════════════════════════════

const IG_CONFIG = {
    token: '',       // ← PASTE LONG-LIVED ACCESS TOKEN HERE
    maxPosts: 6      // Number of posts to display
};

async function loadInstagramFeed() {
    const feedEl = document.getElementById('instagram-feed');
    const staticEl = document.getElementById('gallery-static');

    // No token configured — keep the static fallback visible
    if (!IG_CONFIG.token) return;

    try {
        const res = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&limit=${IG_CONFIG.maxPosts}&access_token=${IG_CONFIG.token}`
        );
        if (!res.ok) throw new Error(`Instagram API ${res.status}`);

        const data = await res.json();
        const posts = data.data || [];

        if (!posts.length) return;

        // Build gallery grid from API data
        const grid = document.createElement('div');
        grid.className = 'gallery-grid';

        posts.forEach(post => {
            const imgSrc = post.media_type === 'VIDEO'
                ? (post.thumbnail_url || post.media_url)
                : post.media_url;

            const caption = post.caption
                ? post.caption.substring(0, 80) + '…'
                : 'View on Instagram';

            const safeCaption = caption.replace(/"/g, '&quot;');

            grid.innerHTML += `
                <a href="${post.permalink}" target="_blank" rel="noopener" class="gallery-item" title="${safeCaption}">
                    <img src="${imgSrc}" alt="${safeCaption}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
                    <div class="gallery-overlay"><span>View Post</span></div>
                </a>`;
        });

        feedEl.appendChild(grid);
        // Static grid auto-hides via CSS: #instagram-feed:not(:empty) ~ #gallery-static

    } catch (err) {
        console.warn('Instagram feed fetch failed:', err);
        // Static fallback remains visible
    }
}

loadInstagramFeed();
