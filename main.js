const LERP = (s, e, a) => s + (e - s) * a;

document.addEventListener('DOMContentLoaded', () => {
    let currentScroll = window.pageYOffset;
    let desiredScroll = currentScroll;

    const parallaxConfig = [
        { sel: '.parallax-img1', spd: 0.2 },
        { sel: '.parallax-img2', spd: 0.1 },
        { sel: '.parallax-front1', spd: -0.1 },
        { sel: '.parallax-front2', spd: -0.3 },
        { sel: '.parallax-behind1', spd: 0.7 },
        { sel: '.parallax-behind2', spd: 0.1 }
    ];

    window.navigateToPage = (id) => {
        const el = document.getElementById(id);
        if (el) desiredScroll = el.offsetTop;
    };

    // Cache page data
    const pages = [];
    const fadeEls = [];

    document.querySelectorAll('.page-wrapper').forEach(page => {
        const els = [];
        parallaxConfig.forEach(({ sel, spd }) => {
            page.querySelectorAll(sel).forEach(el => els.push({ el, spd }));
        });

        pages.push({
            page,
            els,
            getCenter: () => page.offsetTop + page.offsetHeight / 2
        });

        const pageScrollDiv = document.getElementById('scrollContent').appendChild(document.createElement('div'));
        pageScrollDiv.innerText = page.id;

        // Cache fade elements
        const sens = parseFloat(page.dataset.fadeSensitivity) || 1;
        fadeEls.push({ el: page, sens });
    });

    const vh = window.innerHeight;
    const vhHalf = vh / 2;

    window.addEventListener('wheel', e => {
        e.preventDefault();
        desiredScroll = Math.max(0, Math.min(
            desiredScroll + e.deltaY,
            document.body.scrollHeight - vh
        ));
    }, { passive: false });

    // Animation loop
    const update = () => {
        currentScroll = LERP(currentScroll, desiredScroll, 0.07);
        window.scrollTo(0, currentScroll);

        const viewCenter = currentScroll + vhHalf;

        // Parallax
        pages.forEach(({ els, getCenter }) => {
            const scroll = viewCenter - getCenter();
            els.forEach(({ el, spd }) => {
                el.style.transform = `translateY(${scroll * spd}px)`;
            });
        });

        // Fade
        fadeEls.forEach(({ el, sens }) => {
            const rect = el.getBoundingClientRect();
            const dist = Math.abs((rect.top + rect.bottom) / 2 - vhHalf);
            el.style.opacity = Math.max(0, 1 - dist / (vh / sens));
        });

        const contentHeight = document.getElementById('scrollContent').scrollHeight;
        const maxScroll = document.documentElement.scrollHeight;
        
        document.getElementById('scrollContent').style.transform = `translateY(${(-currentScroll / maxScroll * contentHeight)}px)`;

        requestAnimationFrame(update);
    };

    update();
});
