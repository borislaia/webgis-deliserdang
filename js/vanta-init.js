// Initialize VANTA.NET with provided settings
let vantaInstance = null;

function initVanta() {
  const target = document.getElementById('vanta-bg');
  if (!target || !window.VANTA || !window.VANTA.NET) return;
  if (vantaInstance) {
    try { vantaInstance.destroy(); } catch (_) {}
    vantaInstance = null;
  }
  vantaInstance = window.VANTA.NET({
    el: target,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x40000,
    backgroundColor: 0xdedede,
    points: 12.00,
    maxDistance: 12.00,
    spacing: 12.00
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
    /* Ensure content paints above the background */
    #app, .app-header, .app-footer, .layout, .home, main, .map-container, .float-controls, .float-panel { position: relative; z-index: 1; }
  `;
  document.head.appendChild(style);
}

function onScriptsReady(cb){
  if (window.VANTA && window.VANTA.NET) { cb(); return; }
  let tries = 0;
  const t = setInterval(() => {
    tries++;
    if (window.VANTA && window.VANTA.NET) { clearInterval(t); cb(); }
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
