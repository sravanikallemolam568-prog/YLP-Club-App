// Animated Android Splash Screen Component

export function renderSplashScreen(onFinish) {
  const splash = document.createElement('div');
  splash.id = 'app-splash-screen';
  splash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #123F3A 0%, #1E7D76 58%, #2FB8AD 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: #FFFFFF;
    transition: opacity 0.5s ease, transform 0.5s ease;
  `;

  splash.innerHTML = `
    <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
      <img src="/gavel-club-logo.svg" alt="PSS Miyapur Gavel Club logo" style="width: 130px; height: 130px; filter: drop-shadow(0 0 25px rgba(69, 201, 189, 0.4)); animation: pulseGlow 2s infinite ease-in-out;" />
      <div>
        <h1 style="max-width: 90vw; font-family: 'Outfit', sans-serif; font-size: clamp(1.55rem, 7vw, 2.2rem); line-height: 1.15; font-weight: 800; color: #FFFFFF; margin: 0;">PSS MIYAPUR GAVEL</h1>
        <p style="font-size: 0.95rem; color: #DFF7F5; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">GAVEL CLUB MANAGEMENT</p>
      </div>
      <div style="width: 48px; height: 48px; border: 3.5px solid rgba(223, 247, 245, 0.28); border-top-color: #FFFFFF; border-radius: 50%; animation: spin 1s infinite linear; margin-top: 10px;"></div>
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;

  document.body.appendChild(splash);

  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.05)';
    setTimeout(() => {
      splash.remove();
      if (onFinish) onFinish();
    }, 500);
  }, 1800);
}
