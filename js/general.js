/*!
Project: Cause and FX
File: general.js — header, navigation, and GSAP scroll animations
*/

var $ = jQuery.noConflict();

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ==========================================
// 1. STICKY HEADER — hide on scroll down, reveal on scroll up
// ==========================================

var lastScrollTop = 0;

function fixedHeader() {
    var $header = $('.site-header');
    var scrollTop = $(window).scrollTop();

    $header.toggleClass('scrolled', scrollTop > 40);

    if (scrollTop > 120 && scrollTop > lastScrollTop && !$('body').hasClass('menu-open')) {
        $header.addClass('is-hidden');
    } else {
        $header.removeClass('is-hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

$(window).on('load resize scroll', fixedHeader);

// ==========================================
// 1b. DARK NAV — light sections flip the logo and burger to black
// ==========================================
//
// Static per page:   <header class="site-header dark-nav">
// Per section:       <section data-nav="dark"> on any light-background block,
//                    and the class is toggled as it passes under the header.
// Pages with neither carry on with the white nav.

function initDarkNav() {
    var $header = $('.site-header');
    var $marks = $('[data-nav="dark"]');

    // No marked sections: whatever the markup set stays put, so a page that
    // just carries class="site-header dark-nav" keeps it.
    if (!$header.length || !$marks.length) {
        return;
    }

    function sync() {
        var line = $header.outerHeight() / 2;
        var over = false;

        $marks.each(function () {
            var r = this.getBoundingClientRect();
            if (r.top <= line && r.bottom >= line) {
                over = true;
                return false;
            }
        });

        $header.toggleClass('dark-nav', over);
    }

    $(window).on('load resize scroll', sync);
    sync();
}

// ==========================================
// 2. DOCUMENT READY
// ==========================================

$(document).ready(function () {

    // a. Slide-in navigation panel
    megaMenu();

    // b. Show reel overlay
    var $body = $('body');
    var $reel = $('#show-reel');
    var $reelVideo = $('.js-reel-video');
    var $reelOpen = $('.js-reel-open');

    function openReel() {
        $reel.removeAttr('hidden');
        // let the browser apply the un-hidden state before transitioning
        requestAnimationFrame(function () {
            $body.addClass('reel-open no-scroll');
        });
        $('.js-reel-close').trigger('focus');

        // load the embed on first open, and let Vimeo autoplay from there
        var frame = $reelVideo.get(0);
        if (frame && !frame.getAttribute('src')) {
            frame.setAttribute('src', frame.getAttribute('data-src') + '&autoplay=1');
        }
    }

    function closeReel() {
        $body.removeClass('reel-open no-scroll');

        // dropping the src is what stops Vimeo playing behind the closed overlay
        var frame = $reelVideo.get(0);
        if (frame) {
            frame.removeAttribute('src');
        }
        $reelOpen.trigger('focus');
        setTimeout(function () {
            if (!$body.hasClass('reel-open')) {
                $reel.attr('hidden', 'hidden');
            }
        }, 400);
    }

    $reelOpen.on('click', function (e) {
        e.preventDefault();
        openReel();
    });

    $('.js-reel-close').on('click', function (e) {
        e.preventDefault();
        closeReel();
    });

    // backdrop click, but not clicks on the player itself
    $reel.on('click', function (e) {
        if (e.target === this) {
            closeReel();
        }
    });

    $(document).on('keyup.reelModal', function (e) {
        if (e.key === 'Escape' && $body.hasClass('reel-open')) {
            closeReel();
        }
    });

    // c. Footer year
    $('.footer-year, .js-year').text(new Date().getFullYear());

    // d. Smooth scroll for in-page anchors
    $("a[href^='#']").not('.skip-link, .screen-reader-text').on('click', function (e) {
        var href = $(this).attr('href');
        if (href && href.length > 1 && $(href).length) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: $(href).offset().top }, 700);
        }
    });

    // e. Dark nav + scroll animations
    initDarkNav();
    initScrollAnimations();
});

$(window).on('load scroll', function () {
    addAnimation();
});

// ==========================================
// 4. NAVIGATION — slide-in panel
// ==========================================

function megaMenu() {
    var $body = $('body');
    var $toggle = $('.menu-toggle');
    var $backdrop = $('.nav-backdrop');
    var $close = $('.menu-close');

    $backdrop.removeAttr('hidden');

    function openMenu() {
        $body.addClass('menu-open no-scroll');
        $toggle.attr('aria-expanded', 'true');
    }

    function closeMenu() {
        $body.removeClass('menu-open no-scroll');
        $toggle.attr('aria-expanded', 'false').attr('aria-label', 'Open menu');
    }

    $close.on('click', function (e) {
        e.preventDefault();
        closeMenu();
        $toggle.trigger('focus');
    });

    $('.nav-panel__mark').on('click', function (e) {
        e.preventDefault();
        closeMenu();
        $toggle.trigger('focus');
    });

    $toggle.on('click', function (e) {
        e.preventDefault();
        if ($body.hasClass('menu-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    $backdrop.on('click', closeMenu);

    $(document).on('keyup.megaMenu', function (e) {
        if (e.key !== 'Escape') {
            return;
        }
        if ($body.hasClass('menu-open')) {
            closeMenu();
            $toggle.trigger('focus');
        }
    });

    $('.primary-nav a').on('click', closeMenu);
}

// ==========================================
// 5. SCROLL ANIMATION HELPER
// ==========================================

function addAnimation() {
    if (reduceMotion) {
        return;
    }

    $('.animated[data-class]').each(function () {
        var $el = $(this);
        if ($el.hasClass('animated-active')) {
            return;
        }
        if ($el.isOnScreen(0.15)) {
            $el.addClass('animated-active ' + $el.data('class'));
        }
    });
}

// ==========================================
// 3. GSAP SCROLL ANIMATIONS
// ==========================================

// Fade-up / reveal tweens fire when the trigger reaches ~middle of the viewport
var REVEAL_START = 'top 75%';

/* Services strip — the motion is taken from the reference film, measured frame
   by frame (Vimeo 1060836060, cross-correlating each frame against the last):

       crawl 27px/s -> ramps up over 0.60s -> peaks at 1653px/s
                    -> eases down over 0.75s -> crawl again, held ~1.5s

   So it is one continuous eased swell, not a hard snap: a 61x swing between
   crawl and peak, a ~3.3s cycle, covering about 1.5 card widths each time.
   The rates are stored per card-stride so the feel is identical at any card
   size, and recalculated on resize.

   Can still be grabbed and thrown; on release it settles onto the nearest card.
   The track holds the three cards twice, so wrapping at half its width lands on
   an identical frame and the loop is seamless. */
function initServiceMarquee() {
    var track = document.querySelector('.js-service-track');
    var viewport = document.querySelector('.services__viewport');

    if (!track || !viewport || typeof gsap === 'undefined') {
        return;
    }

    // measured off the reference, expressed in card-strides per second
    var CRAWL_RATE = 0.051;  // strides/sec at the slow end
    var PEAK_RATE = 3.14;    // strides/sec at the top of the swell
    var RAMP_UP = 0.60;      // seconds accelerating into the swell
    var RAMP_DOWN = 0.75;    // seconds easing back out of it
    var CRAWL_HOLD = 1.50;   // seconds of crawl before the next swell
    var SETTLE_TIME = 0.40;  // seconds to settle onto a card after a drag
    var DRAG_SLOP = 6;       // movement past this counts as a drag, not a click

    var loopWidth = 0;
    var offset = 0;
    var dragging = false;
    var lastX = 0;
    var moved = 0;
    var pace = { speed: 0 };
    var paceTl = null;

    function measure() {
        loopWidth = track.scrollWidth / 2;
    }

    function wrap(value) {
        if (loopWidth <= 0) {
            return 0;
        }
        value %= loopWidth;
        if (value > 0) {
            value -= loopWidth;
        }
        return value;
    }

    function apply() {
        gsap.set(track, { x: wrap(offset) });
    }

    // one card plus the gap after it
    function stride() {
        var card = track.querySelector('.service-card');
        if (!card) {
            return 0;
        }
        var style = getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap) || 0;
        return card.getBoundingClientRect().width + gap;
    }

    function buildPace() {
        if (paceTl) {
            paceTl.kill();
            paceTl = null;
        }
        if (reduceMotion) {
            pace.speed = 0;
            return;
        }
        var step = stride();
        if (step <= 0) {
            return;
        }
        var crawl = CRAWL_RATE * step;
        var peak = PEAK_RATE * step;

        pace.speed = crawl;
        paceTl = gsap.timeline({ repeat: -1 })
            .to(pace, { speed: peak, duration: RAMP_UP, ease: 'power3.in' })
            .to(pace, { speed: crawl, duration: RAMP_DOWN, ease: 'power3.out' })
            .to(pace, { speed: crawl, duration: CRAWL_HOLD });
    }

    // integrate the current speed into the position every frame
    function tick(time, delta) {
        if (loopWidth <= 0 || dragging || reduceMotion) {
            return;
        }
        offset -= pace.speed * (delta / 1000);
        apply();
    }

    // ---- grab to scroll ----
    viewport.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 && e.pointerType === 'mouse') {
            return;
        }
        if (paceTl) {
            paceTl.pause();
        }
        gsap.killTweensOf(pace);
        dragging = true;
        moved = 0;
        lastX = e.clientX;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', function (e) {
        if (!dragging) {
            return;
        }
        var dx = e.clientX - lastX;
        lastX = e.clientX;
        moved += Math.abs(dx);
        offset += dx;
        apply();
    });

    function endDrag(e) {
        if (!dragging) {
            return;
        }
        dragging = false;
        viewport.classList.remove('is-dragging');
        if (e && e.pointerId !== undefined && viewport.hasPointerCapture(e.pointerId)) {
            viewport.releasePointerCapture(e.pointerId);
        }

        var step = stride();
        var resume = function () {
            if (paceTl) {
                // pick back up at the crawl, not mid-swell
                paceTl.play(RAMP_UP + RAMP_DOWN);
            }
        };

        if (step > 0) {
            gsap.to({ v: offset }, {
                v: Math.round(offset / step) * step,
                duration: SETTLE_TIME,
                ease: 'power3.out',
                onUpdate: function () { offset = this.targets()[0].v; apply(); },
                onComplete: resume
            });
        } else {
            resume();
        }
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // a drag that ends on a card must not follow its link
    viewport.addEventListener('click', function (e) {
        if (moved > DRAG_SLOP) {
            e.preventDefault();
            e.stopPropagation();
            moved = 0;
        }
    }, true);

    measure();
    apply();
    buildPace();
    gsap.ticker.add(tick);

    $(window).on('load', function () { measure(); apply(); buildPace(); });

    var resizeTimer;
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            measure();
            apply();
            buildPace();   // rates are per-stride, so re-derive them
        }, 250);
    });
}

// Fade-up display lines (intro + final CTA). Replays on re-enter; reverses on scroll-back.
function initFadeUpDisplayLines(scopeSelector, triggerSelector) {
    var scope = document.querySelector(scopeSelector);
    if (!scope) {
        return;
    }

    var lines = scope.querySelectorAll('.reveal-line');
    if (!lines.length) {
        return;
    }

    var yFrom = !window.matchMedia('(max-width: 1024px)').matches ? 110 : 72;

    gsap.fromTo(lines,
        { opacity: 0, y: yFrom },
        {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.16,
            scrollTrigger: {
                trigger: triggerSelector,
                start: REVEAL_START,
                toggleActions: 'play none play reverse',
                invalidateOnRefresh: true
            }
        }
    );
}

function initScrollAnimations() {

    // Nothing can animate these back in, so release the CSS start states or the
    // content would stay parked off-screen for good.
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        document.documentElement.classList.remove('anim-ready');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // The services strip is set up first: under reduced-motion it stops drifting
    // by itself, but grab-to-scroll has to keep working either way.
    initServiceMarquee();

    // Parallax stack-pin lives inside <main>, so CSS sticky would otherwise last
    // for the whole page. Release it once Dare / Craft / Deliver enters view.
    var parallaxBand = document.querySelector('.parallax-band.stack-pin');
    var servicesSection = document.querySelector('.services');
    var parallaxPinTrigger;
    if (parallaxBand && servicesSection) {
        function syncParallaxPinState(st) {
            st = st || parallaxPinTrigger;
            if (!st) {
                return;
            }

            var isDesktop = !window.matchMedia('(max-width: 1024px)').matches;
            if (!isDesktop) {
                parallaxBand.classList.remove('is-unpinned');
                return;
            }

            // Compare scroll position to the trigger's recalculated start — resize
            // does not re-fire onEnter/onLeaveBack, so state must be synced here.
            parallaxBand.classList.toggle('is-unpinned', st.scroll() >= st.start);
        }

        parallaxPinTrigger = ScrollTrigger.create({
            trigger: servicesSection,
            start: 'top bottom',
            onEnter: function () {
                parallaxBand.classList.add('is-unpinned');
            },
            onLeaveBack: function () {
                parallaxBand.classList.remove('is-unpinned');
            },
            onRefresh: syncParallaxPinState
        });

        var parallaxPinResizeTimer;
        $(window).on('resize', function () {
            clearTimeout(parallaxPinResizeTimer);
            parallaxPinResizeTimer = setTimeout(function () {
                ScrollTrigger.refresh();
                syncParallaxPinState(parallaxPinTrigger);
            }, 200);
        });

        syncParallaxPinState(parallaxPinTrigger);
    }

    // Honour reduced-motion: everything else stays put and visible.
    if (reduceMotion) {
        document.documentElement.classList.remove('anim-ready');
        return;
    }

    var isDesktop = !window.matchMedia('(max-width: 1024px)').matches;

    // ---- 3a. Hero — the reel sinks and dims as the intro rides over it ----
    var $hero = $('.hero');
    if ($hero.length) {
        var $heroOverlay = $('.hero__overlay');
        if ($heroOverlay.length) {
            $heroOverlay.addClass('not-active').removeClass('active');
        }

        function setHeroOverlayState(isActive) {
            $heroOverlay.toggleClass('active', isActive);
            $heroOverlay.toggleClass('not-active', !isActive);
        }

        gsap.to('.hero__media', {
            scale: 1.08,
            yPercent: -12,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });

        gsap.fromTo('.hero__overlay',
            { opacity: 0.2 },
            {
                opacity: 1,
                ease: 'power2.in',
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: '75% top',
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) {
                        setHeroOverlayState(self.progress > 0);
                    },
                    onLeaveBack: function () {
                        setHeroOverlayState(false);
                    }
                }
            }
        );

        gsap.fromTo('.intro .container',
            { yPercent: 6 },
            {
                yPercent: -6,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.intro',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.6
                }
            }
        );

        initFadeUpDisplayLines('.intro__title', '.intro__title');

        gsap.utils.toArray('.intro .js-reveal').forEach(function (el) {
            gsap.fromTo(el,
                { opacity: 0, y: 56 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.intro__title',
                        start: 'top bottom',
                        toggleActions: 'play none play reverse',
                        invalidateOnRefresh: true
                    }
                }
            );
        });

        gsap.fromTo('.hero__reel',
            { opacity: 0, y: 24 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.6,
                ease: 'power3.out'
            }
        );

        function showHeroReel() {
            gsap.to('.hero__reel', {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }

        function hideHeroReel() {
            gsap.to('.hero__reel', {
                opacity: 0,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }

        ScrollTrigger.create({
            trigger: '.intro',
            start: 'top 85%',
            onEnter: hideHeroReel,
            onLeaveBack: showHeroReel
        });

        ScrollTrigger.create({
            trigger: '.hero-stage',
            start: 'top top',
            onEnterBack: showHeroReel
        });
    }

    // ---- 3b. Generic fade-up reveal ----
    gsap.utils.toArray('.js-reveal').forEach(function (el) {
        if (el.closest('.intro') || el.closest('.final-cta')) {
            return;
        }
        gsap.fromTo(el,
            { opacity: 0, y: 42 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: REVEAL_START,
                    toggleActions: 'play none play reverse'
                }
            }
        );
    });

    // ---- 3c. Split display headings — outline half in from the left,
    //          solid half in from the right ----
    gsap.utils.toArray('.js-slide-left').forEach(function (el) {
        gsap.fromTo(el,
            { opacity: 0, x: isDesktop ? -220 : -70 },
            {
                opacity: 1,
                x: 0,
                duration: 1.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none play reverse'
                }
            }
        );
    });

    gsap.utils.toArray('.js-slide-right').forEach(function (el) {
        gsap.fromTo(el,
            { opacity: 0, x: isDesktop ? 220 : 70 },
            {
                opacity: 1,
                x: 0,
                duration: 1.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none play reverse'
                }
            }
        );
    });

    // ---- 3d. Display headings that rise into place -------------------------
    //  Only the parallax band slides horizontally: Figma parks those two lines
    //  far off-canvas (-66% / +99%). Every other display heading sits at its
    //  normal x, and the final-CTA lines carry opacity-0 — so they fade and
    //  lift rather than sliding in from the sides.
    gsap.utils.toArray('.js-rise').forEach(function (group) {
        // Intro + final CTA headings use section-scrubbed reveals below.
        if (group.closest('.intro') || group.closest('.final-cta')) {
            return;
        }

        var masked = group.querySelectorAll('.reveal-line > span');

        // Masked lines climb up from underneath their own clip box.
        // y is pinned to 0 in both states on purpose: the CSS start state parks
        // them with a percentage translate, the browser resolves that to px, and
        // GSAP would otherwise treat it as a separate y offset and add it to
        // yPercent — double-parking the line and leaving it low when it lands.
        if (masked.length) {
            gsap.fromTo(masked,
                { yPercent: 210, y: 0 },
                {
                    yPercent: 0,
                    y: 0,
                    duration: 1.15,
                    ease: 'power3.out',
                    stagger: 0.14,
                    scrollTrigger: {
                        trigger: group,
                        start: REVEAL_START,
                        toggleActions: 'play none play reverse'
                    }
                }
            );
            return;
        }

        var lines = group.querySelectorAll('span');
        if (!lines.length) {
            lines = [group];
        }

        gsap.fromTo(lines,
            { opacity: 0, y: isDesktop ? 46 : 28 },
            {
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: 'power3.out',
                stagger: 0.13,
                scrollTrigger: {
                    trigger: group,
                    start: REVEAL_START,
                    toggleActions: 'play none play reverse'
                }
            }
        );
    });

    // ---- 3e-i. Final CTA — background grows in + content reveals on scroll ----
    var $ctaBg = $('.final-cta__bg');
    if ($ctaBg.length) {
        // Growth and parallax need different scroll ranges — the panel must be
        // full width by the time the section reaches the top, while the parallax
        // runs for the whole pass. They are separate tweens on the same node but
        // on different transform components, so overwrite is disabled: letting
        // GSAP auto-overwrite is what previously killed the scale.
        gsap.fromTo('.final-cta__bg',
            { scale: 0.82, borderRadius: '28px' },
            {
                scale: 1.1,
                borderRadius: '0px',
                ease: 'none',
                overwrite: false,
                scrollTrigger: {
                    trigger: '.final-cta',
                    start: 'top bottom',
                    end: 'top top',
                    scrub: 0.5,
                    invalidateOnRefresh: true
                }
            }
        );

        gsap.fromTo('.final-cta__bg',
            { yPercent: -8 },
            {
                yPercent: 8,
                ease: 'none',
                overwrite: false,
                immediateRender: false,
                scrollTrigger: {
                    trigger: '.final-cta',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.5,
                    invalidateOnRefresh: true
                }
            }
        );

        initFadeUpDisplayLines('.final-cta__title', '.final-cta__title');

        gsap.utils.toArray('.final-cta .js-reveal').forEach(function (el) {
            gsap.fromTo(el,
                { opacity: 0, y: 56 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.final-cta__title',
                        start: REVEAL_START,
                        toggleActions: 'play none play reverse',
                        invalidateOnRefresh: true
                    }
                }
            );
        });
    }

    // ---- 3e. Parallax backgrounds ----
    gsap.utils.toArray('.parallax-band__bg').forEach(function (bg) {
        gsap.fromTo(bg,
            { yPercent: -8 },
            {
                yPercent: 8,
                ease: 'none',
                scrollTrigger: {
                    trigger: bg.parentNode,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            }
        );
    });

    // ---- 3f. Filmography posters — staggered rise ----
    var posters = gsap.utils.toArray('.js-poster');
    if (posters.length) {
        gsap.fromTo(posters,
            { opacity: 0, y: 60 },
            {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power3.out',
                stagger: 0.07,
                scrollTrigger: {
                    trigger: '.filmography__grid',
                    start: REVEAL_START,
                    toggleActions: 'play none play reverse'
                }
            }
        );
    }

    // ---- 3g. Services — DARE. / CRAFT. / DELIVER. sweep in from the left
    //          into their right-descending staircase ----
    var stairWords = gsap.utils.toArray('.js-stair');
    if (stairWords.length) {
        // Each word starts clear of the left edge of the window. The words are
        // block-level and all span the same box, so one viewport-wide offset
        // clears every one of them — and unlike measuring each element it does
        // not depend on layout having settled when the tween is built.
        var offscreenLeft = function () {
            return -(window.innerWidth + 120);
        };

        gsap.fromTo(stairWords,
            { opacity: 1, x: offscreenLeft },
            {
                x: 0,
                duration: 1.45,
                ease: 'power3.out',
                stagger: 0.18,
                scrollTrigger: {
                    trigger: '.services__words',
                    start: 'top 85%',
                    toggleActions: 'play none play reverse',
                    invalidateOnRefresh: true
                }
            }
        );
    }

    // ---- 3i. Top studios — rule draws out, logos fade in ----
    var rule = document.querySelector('.js-rule');
    if (rule) {
        gsap.fromTo(rule,
            { scaleX: 0 },
            {
                scaleX: 1,
                duration: 1.4,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: rule,
                    start: 'top 92%',
                    toggleActions: 'play none play reverse'
                }
            }
        );
    }

    var logos = gsap.utils.toArray('.js-logo');
    if (logos.length) {
        gsap.fromTo(logos,
            { opacity: 0, y: 26 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                stagger: 0.06,
                scrollTrigger: {
                    trigger: '.studio-logos',
                    start: REVEAL_START,
                    toggleActions: 'play none play reverse'
                }
            }
        );
    }

    // Recalculate once fonts and images have settled
    if (document.readyState === 'complete') {
        ScrollTrigger.refresh();
    } else {
        $(window).on('load', function () {
            ScrollTrigger.refresh();
        });
    }
}

// ==========================================
// 6. isOnScreen plugin
// ==========================================

$.fn.isOnScreen = function (offsetPercent) {
    if (!this.length) {
        return false;
    }

    var win = $(window);
    var viewportTop = win.scrollTop();
    var viewportBottom = viewportTop + win.height();
    var threshold = win.height() * (offsetPercent || 0);
    var elem = this.eq(0);
    var bounds = elem.offset();

    if (!bounds) {
        return false;
    }

    var top = bounds.top;
    var bottom = top + elem.outerHeight();

    return bottom > viewportTop + threshold && top < viewportBottom - threshold;
};
