const LERP = (start, end, amount) => start + (end - start) * amount;
const HEARTBEAT = (callback) => {
    let lastTime = Date.now(); // Fix: Use Date.now() to get current time in milliseconds
    let f = () => {
        let currentTime = Date.now();
        callback((currentTime - lastTime) / 1000); // deltaTime in seconds
        lastTime = currentTime;
        requestAnimationFrame(f);
    };
    f(); // Fix: Start the animation loop
};

document.addEventListener('DOMContentLoaded', () => {
    let currentScroll = 0;
    let desiredScroll = 0;

    // Fix: Listen on window, not document
    window.addEventListener('wheel', e => {
        e.preventDefault(); // Prevent default scroll
        desiredScroll += e.deltaY; // Add scroll delta
        desiredScroll = Math.max(0, Math.min(desiredScroll, document.body.scrollHeight - window.innerHeight)); // Clamp
    }, { passive: false });

    HEARTBEAT(dt => {
        currentScroll = LERP(currentScroll, desiredScroll, 0.1);
        window.scrollTo(0, currentScroll); // Fix: Use scrollTo instead of setting pageYOffset
    });

});
