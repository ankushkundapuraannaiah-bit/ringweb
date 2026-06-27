import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   VIDEO SCROLL SCRUB  — uses video.currentTime (no frames)
   ============================================================ */
function setupVideoScrub(videoId, pinWrapperId, panels) {
  const video = document.getElementById(videoId);
  if (!video) return;

  // Ensure video is paused and ready for scrubbing
  video.pause();
  video.currentTime = 0;

  // After metadata is loaded we know the duration
  function init() {
    const duration = video.duration;
    if (!duration || isNaN(duration)) return;

    // Main scrub trigger — pin wrapper drives the video timeline
    ScrollTrigger.create({
      trigger  : `#${pinWrapperId}`,
      start    : 'top top',
      end      : 'bottom bottom',
      scrub    : 1.5,        // smooth scrub lag (feels cinematic)
      onUpdate : (self) => {
        const t = self.progress * duration;
        // Clamp to avoid seeking past end
        video.currentTime = Math.min(t, duration - 0.05);
      }
    });

    // Text panel animations triggered at scroll milestones
    panels.forEach(({ id, start, end }) => {
      const el = document.getElementById(id);
      if (!el) return;

      gsap.timeline({
        scrollTrigger: {
          trigger  : `#${pinWrapperId}`,
          start    : `${start * 100}% top`,
          end      : `${end * 100}% top`,
          scrub    : true,
        }
      })
      .fromTo(el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
      .to(el,
        { opacity: 0, y: -25, duration: 0.25, ease: 'power2.in' },
        '>+0.3'
      );
    });
  }

  if (video.readyState >= 1) {
    init();
  } else {
    video.addEventListener('loadedmetadata', init, { once: true });
    // Fallback — also trigger on canplay
    video.addEventListener('canplay', init, { once: true });
  }
}

/* ============================================================
   INITIALISE BOTH VIDEO SEQUENCES
   ============================================================ */
// Ring video — 3 panels at different scroll depths
setupVideoScrub('ring-video', 'ring-pin', [
  { id: 'rp-a', start: 0.05, end: 0.38 },
  { id: 'rp-b', start: 0.42, end: 0.72 },
  { id: 'rp-c', start: 0.76, end: 0.95 },
]);

// Hand video — 2 panels
setupVideoScrub('hand-video', 'hand-pin', [
  { id: 'hp-a', start: 0.05, end: 0.48 },
  { id: 'hp-b', start: 0.52, end: 0.92 },
]);

/* ============================================================
   PIN STICKY DIVs CORRECTLY (GSAP pin needs the sticky child)
   ============================================================ */
// Ring sticky
ScrollTrigger.create({
  trigger   : '#ring-pin',
  start     : 'top top',
  end       : 'bottom bottom',
  pin       : '#ring-sticky',
  pinSpacing: false,
  id        : 'ring-sticky-pin',
});

// Hand sticky
ScrollTrigger.create({
  trigger   : '#hand-pin',
  start     : 'top top',
  end       : 'bottom bottom',
  pin       : '#hand-sticky',
  pinSpacing: false,
  id        : 'hand-sticky-pin',
});

/* ============================================================
   REVEAL ANIMATIONS — elements with .reveal class
   ============================================================ */
document.querySelectorAll('.reveal').forEach((el) => {
  gsap.fromTo(el,
    { opacity: 0, y: 45 },
    {
      opacity : 1,
      y       : 0,
      duration: 0.9,
      ease    : 'power3.out',
      scrollTrigger: {
        trigger     : el,
        start       : 'top 88%',
        toggleActions: 'play none none reverse',
      }
    }
  );
});

/* ============================================================
   HERO RING IMAGE — subtle float animation
   ============================================================ */
const heroRing = document.getElementById('hero-ring-img');
if (heroRing) {
  gsap.to(heroRing, {
    y       : -18,
    duration: 3,
    ease    : 'sine.inOut',
    yoyo    : true,
    repeat  : -1,
  });
}

/* ============================================================
   PRODUCT CARDS — stagger entrance
   ============================================================ */
gsap.fromTo('.prod-card',
  { opacity: 0, y: 60 },
  {
    opacity : 1,
    y       : 0,
    stagger : 0.14,
    duration: 0.8,
    ease    : 'power3.out',
    scrollTrigger: {
      trigger     : '.products-grid',
      start       : 'top 82%',
      toggleActions: 'play none none reverse',
    }
  }
);

/* ============================================================
   ACTIVE NAV — highlight as section enters viewport
   ============================================================ */
const sections = ['home', 'ring', 'hand', 'about', 'shop'];

sections.forEach((id) => {
  ScrollTrigger.create({
    trigger     : `#${id}`,
    start       : 'top 45%',
    end         : 'bottom 45%',
    onEnter     : () => setActive(id),
    onEnterBack : () => setActive(id),
  });
});

function setActive(id) {
  document.querySelectorAll('.sb-link, .mob-nav-item[data-sec]').forEach((el) => {
    el.classList.toggle('active', el.dataset.sec === id);
  });
}

/* ============================================================
   CART STATE
   ============================================================ */
let cart = [];

const cartDrawer   = document.getElementById('cart-drawer');
const cartBody     = document.getElementById('cart-body');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartBadge    = document.getElementById('cart-badge');
const mobCartBadge = document.getElementById('mob-cart-badge');

function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const sub   = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (cartBadge)    cartBadge.textContent    = count;
  if (mobCartBadge) mobCartBadge.textContent = count;
  if (cartSubtotal) cartSubtotal.textContent = `$${sub}`;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-bag-shopping"></i>
        Your cart is empty.<br/>Add a ring to begin.
      </div>`;
    return;
  }

  cartBody.innerHTML = '';
  cart.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item__info">
        <h4>${item.name}</h4>
        <p>$${item.price} &times; ${item.qty}</p>
      </div>
      <button class="cart-rm" data-id="${item.id}" aria-label="Remove ${item.name}">
        <i class="fa-solid fa-trash-can"></i>
      </button>`;
    el.querySelector('.cart-rm').addEventListener('click', () => {
      cart = cart.filter((c) => c.id !== item.id);
      renderCart();
    });
    cartBody.appendChild(el);
  });
}

function addToCart(id, name, price) {
  const exists = cart.find((i) => i.id === id);
  if (exists) { exists.qty++; }
  else        { cart.push({ id, name, price: Number(price), qty: 1 }); }
  renderCart();
  openCart();
}

function openCart()  {
  cartDrawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  document.body.style.overflow = '';
}

// Add-to-cart buttons (product cards)
document.querySelectorAll('.add-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const card = e.currentTarget.closest('.prod-card');
    addToCart(card.dataset.id, card.dataset.name, card.dataset.price);
  });
});

// Open / close cart bindings
document.getElementById('sb-cart-btn')?.addEventListener('click',  openCart);
document.getElementById('mob-cart-btn')?.addEventListener('click', openCart);
document.getElementById('mob-nav-cart')?.addEventListener('click', openCart);
document.getElementById('cart-close-btn')?.addEventListener('click', closeCart);

// Close on outside click
document.addEventListener('click', (e) => {
  if (
    cartDrawer.classList.contains('open') &&
    !cartDrawer.contains(e.target) &&
    !e.target.closest('#sb-cart-btn') &&
    !e.target.closest('#mob-cart-btn') &&
    !e.target.closest('#mob-nav-cart')
  ) {
    closeCart();
  }
});

// Checkout
document.getElementById('checkout-btn')?.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Please add a ring to your cart first.');
    return;
  }
  alert('Initiating secure checkout — your energy calibration is in progress…');
});

/* ============================================================
   NEWSLETTER
   ============================================================ */
document.getElementById('news-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = e.target.querySelector('.news-input');
  if (inp.value) {
    alert(`✓ ${inp.value} has been added to the Inner Cycle. Welcome.`);
    inp.value = '';
  }
});

/* ============================================================
   SMOOTH ANCHOR SCROLL (sidebar + mobile nav links)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ============================================================
   INITIAL RENDER
   ============================================================ */
renderCart();

window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});
