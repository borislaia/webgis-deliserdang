// Initialize VANTA.DOTS with transparent background to preserve white theme
let vantaInstance = null;

function initVanta() {
  const target = document.getElementById('vanta-bg');
  if (!target || !window.VANTA || !window.VANTA.DOTS) return;
  if (vantaInstance) {
    try { vantaInstance.destroy(); } catch (_) {}
    vantaInstance = null;
  }
  vantaInstance = window.VANTA.DOTS({
    el: target,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x0a84ff,
    color2: 0x5e5ce6,
    backgroundAlpha: 0.0, // transparent so page's white theme shows
    size: 2.8,
    spacing: 28.0
  });
}

function ensureVantaContainerStyle() {
  const styleId = 'vanta-bg-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #vanta-bg{
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    /* Ensure app content is above background */
    #app, .app-header, .app-footer, .layout, .home, .map-container, .float-controls, .float-panel { position: relative; z-index: 1; }
  `;
  document.head.appendChild(style);
}

function onScriptsReady(cb){
  if (window.VANTA && window.VANTA.DOTS) { cb(); return; }
  let tries = 0;
  const t = setInterval(() => {
    tries++;
    if (window.VANTA && window.VANTA.DOTS) { clearInterval(t); cb(); }
    if (tries > 100) { clearInterval(t); }
  }, 50);
}

ensureVantaContainerStyle();
onScriptsReady(initVanta);

window.addEventListener('resize', () => {
  if (vantaInstance && typeof vantaInstance.resize === 'function') {
    vantaInstance.resize();
  }
});
