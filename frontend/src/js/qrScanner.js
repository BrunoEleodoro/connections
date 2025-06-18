/*
 * QR Scanner Module
 * Uses getUserMedia + jsQR for decoding QR codes.
 * Returns the decoded string or null if cancelled.
 */

export async function startQrScanner() {
  // Check for camera support
  if (!navigator.mediaDevices?.getUserMedia) {
    return promptFallback();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.createElement('video');
    video.setAttribute('playsinline', ''); // Required to tell iOS Safari not to go fullscreen
    video.srcObject = stream;
    await video.play();

    // Create overlay canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Append elements
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9999;`;
    overlay.append(video, canvas);
    video.style.maxWidth = '100%';
    video.style.transform = 'scaleX(-1)'; // Mirror
    document.body.appendChild(overlay);

    // Dynamically import jsQR to keep bundle small when scanner isn't used
    const { default: jsQR } = await import('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.es6.min.js');

    const result = await new Promise(resolve => {
      const tick = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            resolve(code.data);
            return;
          }
        }
        requestAnimationFrame(tick);
      };
      tick();

      // Allow cancellation by clicking overlay
      overlay.addEventListener('click', () => resolve(null), { once: true });
    });

    // Cleanup
    stream.getTracks().forEach(t => t.stop());
    overlay.remove();

    return result;
  } catch (err) {
    console.warn('Camera error', err);
    return promptFallback();
  }
}

function promptFallback() {
  return prompt('Enter connection ID (camera not available):');
} 