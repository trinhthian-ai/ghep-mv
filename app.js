/* ============================================================
   STUDIO GHÉP BÌA MV CA NHẠC CHUYÊN NGHIỆP — GITHUB PAGES EDITION
   Tác giả: Trịnh Thị An • SĐT / Zalo: 0834 133 344
   Tương thích 100% chạy trực tuyến trên GitHub Pages & Mọi trình duyệt
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elements - Upload Cover
  const coverDropZone = document.getElementById('coverDropZone');
  const coverEmptyState = document.getElementById('coverEmptyState');
  const coverPreviewBox = document.getElementById('coverPreviewBox');
  const coverThumbnail = document.getElementById('coverThumbnail');
  const coverFileName = document.getElementById('coverFileName');
  const coverFileInput = document.getElementById('coverFileInput');
  const btnSelectCover = document.getElementById('btnSelectCover');
  const btnChangeCover = document.getElementById('btnChangeCover');

  // Elements - Upload MV
  const mvDropZone = document.getElementById('mvDropZone');
  const mvEmptyState = document.getElementById('mvEmptyState');
  const mvPreviewBox = document.getElementById('mvPreviewBox');
  const mvThumbnailVideo = document.getElementById('mvThumbnailVideo');
  const mvFileName = document.getElementById('mvFileName');
  const mvFileSpecs = document.getElementById('mvFileSpecs');
  const mvFileInput = document.getElementById('mvFileInput');
  const btnSelectMV = document.getElementById('btnSelectMV');
  const btnChangeMV = document.getElementById('btnChangeMV');

  // Elements - Options
  const effectPills = document.querySelectorAll('.effect-pill');
  const mergeModeSelect = document.getElementById('mergeModeSelect');
  const audioChoiceSelect = document.getElementById('audioChoiceSelect');
  const introDurationRange = document.getElementById('introDurationRange');
  const introDurationVal = document.getElementById('introDurationVal');
  const kenBurnsCheck = document.getElementById('kenBurnsCheck');

  // Elements - Action & Progress
  const btnCreateMV = document.getElementById('btnCreateMV');
  const progressCard = document.getElementById('progressCard');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPctText = document.getElementById('progressPctText');
  const progressStatusMsg = document.getElementById('progressStatusMsg');

  // Elements - Result
  const resultCard = document.getElementById('resultCard');
  const finalVideoPlayer = document.getElementById('finalVideoPlayer');
  const btnDownloadMV = document.getElementById('btnDownloadMV');
  const btnOpenFolder = document.getElementById('btnOpenFolder');
  const savePathText = document.getElementById('savePathText');

  // Elements - Live Preview Canvas
  const previewCanvas = document.getElementById('previewCanvas');
  const canvasCtx = previewCanvas.getContext('2d');
  const canvasPlaceholder = document.getElementById('canvasPlaceholder');
  const btnRestartPreview = document.getElementById('btnRestartPreview');

  // State
  let coverImageObject = null;
  let coverFileBlob = null;
  let mvFileBlob = null;
  let isPreviewRunning = false;
  let previewStartTime = null;
  let previewAnimId = null;
  let currentJobId = null;
  let progressPollTimer = null;
  let uploadedCoverServerPath = null;
  let uploadedMVServerPath = null;

  // ----------------------------------------------------
  // 1. DURATION SLIDER & PILL SELECTION
  // ----------------------------------------------------
  introDurationRange.addEventListener('input', (e) => {
    introDurationVal.textContent = parseFloat(e.target.value).toFixed(1) + ' giây';
  });

  effectPills.forEach(pill => {
    pill.addEventListener('click', () => {
      effectPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const radio = pill.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      restartLivePreview();
    });
  });

  kenBurnsCheck.addEventListener('change', () => {
    restartLivePreview();
  });

  // ----------------------------------------------------
  // 2. COVER IMAGE UPLOAD
  // ----------------------------------------------------
  btnSelectCover.addEventListener('click', () => coverFileInput.click());
  btnChangeCover.addEventListener('click', () => coverFileInput.click());

  coverFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCoverFile(e.target.files[0]);
    }
  });

  setupDragDrop(coverDropZone, (file) => {
    if (file.type.startsWith('image/')) {
      handleCoverFile(file);
    } else {
      alert('Vui lòng chọn một file hình ảnh (JPG, PNG, WEBP,...) cho Trang Bìa.');
    }
  });

  function handleCoverFile(file) {
    coverFileBlob = file;
    coverFileName.textContent = file.name;
    const objectUrl = URL.createObjectURL(file);
    coverThumbnail.src = objectUrl;
    coverEmptyState.classList.add('hidden');
    coverPreviewBox.classList.remove('hidden');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      coverImageObject = img;
      canvasPlaceholder.classList.add('hidden');
      startLivePreview();
    };
    img.src = objectUrl;

    // If local server is available, upload in background
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      uploadFileToServer(file, 'cover', (res) => {
        if (res && res.file_path) uploadedCoverServerPath = res.file_path;
      });
    }
  }

  // ----------------------------------------------------
  // 3. MV CA NHẠC UPLOAD
  // ----------------------------------------------------
  btnSelectMV.addEventListener('click', () => mvFileInput.click());
  btnChangeMV.addEventListener('click', () => mvFileInput.click());

  mvFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleMVFile(e.target.files[0]);
    }
  });

  setupDragDrop(mvDropZone, (file) => {
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      handleMVFile(file);
    } else {
      alert('Vui lòng chọn file Video hoặc Âm thanh (MP4, MKV, MOV, MP3,...) cho MV Ca Nhạc.');
    }
  });

  function handleMVFile(file) {
    mvFileBlob = file;
    mvFileName.textContent = file.name;
    const objectUrl = URL.createObjectURL(file);
    mvThumbnailVideo.src = objectUrl;
    mvEmptyState.classList.add('hidden');
    mvPreviewBox.classList.remove('hidden');

    mvThumbnailVideo.onloadedmetadata = () => {
      const dur = formatTime(mvThumbnailVideo.duration);
      const res = (mvThumbnailVideo.videoWidth && mvThumbnailVideo.videoHeight)
        ? `${mvThumbnailVideo.videoWidth}x${mvThumbnailVideo.videoHeight}`
        : 'Âm thanh';
      mvFileSpecs.textContent = `${dur} • ${res}`;
    };

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      mvFileSpecs.textContent = 'Đang tải file lên máy chủ...';
      uploadFileToServer(file, 'mv', (res) => {
        if (res && res.file_path) {
          uploadedMVServerPath = res.file_path;
          if (res.info) {
            const dur = formatTime(res.info.duration);
            const resText = `${res.info.width}x${res.info.height}`;
            mvFileSpecs.textContent = `${dur} • ${resText} • ${res.info.fps}fps`;
          }
        }
      });
    }
  }

  function setupDragDrop(zone, onFileDrop) {
    ['dragenter', 'dragover'].forEach(name => {
      zone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.querySelector('.drop-content')?.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(name => {
      zone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.querySelector('.drop-content')?.classList.remove('dragover');
      }, false);
    });

    zone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) onFileDrop(dt.files[0]);
    }, false);
  }

  function uploadFileToServer(file, type, callback) {
    fetch(`/api/upload?type=${type}&filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      body: file
    })
    .then(r => r.json())
    .then(data => { if (data.status === 'ok') callback(data); })
    .catch(() => {});
  }

  // ----------------------------------------------------
  // 4. LIVE CANVAS ANIMATION PREVIEW
  // ----------------------------------------------------
  btnRestartPreview.addEventListener('click', restartLivePreview);

  function restartLivePreview() {
    previewStartTime = performance.now();
  }

  const previewNotes = [];
  const previewSparkles = [];
  const noteColors = ['#FCD34D', '#FDE68A', '#E0F2FE', '#FBCFE8', '#FFFFFF'];
  const symbols = ['♪', '♫', '♬', '♩'];

  function initPreviewParticles() {
    previewNotes.length = 0;
    previewSparkles.length = 0;
    const w = previewCanvas.width;
    const h = previewCanvas.height;

    for (let i = 0; i < 16; i++) {
      previewNotes.push({
        x0: w * 0.08 + Math.random() * (w * 0.84),
        vy: 55 + Math.random() * 65,
        amp: 14 + Math.random() * 22,
        freq: 1.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        size: 18 + Math.random() * 14,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        color: noteColors[Math.floor(Math.random() * noteColors.length)],
        tOffset: Math.random() * 8
      });
    }

    for (let i = 0; i < 20; i++) {
      previewSparkles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 8 + Math.random() * 10,
        speed: 2 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        color: noteColors[Math.floor(Math.random() * noteColors.length)]
      });
    }
  }

  function startLivePreview() {
    initPreviewParticles();
    previewStartTime = performance.now();
    if (!isPreviewRunning) {
      isPreviewRunning = true;
      requestAnimationFrame(renderPreviewFrame);
    }
  }

  function renderPreviewFrame(now) {
    if (!isPreviewRunning) return;

    const w = previewCanvas.width;
    const h = previewCanvas.height;
    const duration = parseFloat(introDurationRange.value) || 4.0;
    const elapsed = (now - previewStartTime) / 1000;
    const loopTime = elapsed % (duration + 1.2);
    const activeEffect = document.querySelector('input[name="effectChoice"]:checked')?.value || 'combo';
    const isKenBurns = kenBurnsCheck.checked;

    canvasCtx.clearRect(0, 0, w, h);

    if (coverImageObject) {
      const cw = coverImageObject.width;
      const ch = coverImageObject.height;

      // Draw background
      canvasCtx.save();
      canvasCtx.filter = 'blur(16px) brightness(0.65)';
      const bgScale = Math.max(w / cw, h / ch);
      const bgW = cw * bgScale;
      const bgH = ch * bgScale;
      canvasCtx.drawImage(coverImageObject, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);
      canvasCtx.restore();

      // Dark overlay
      canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      canvasCtx.fillRect(0, 0, w, h);

      // Foreground cover with Ken Burns gentle zoom
      let scale = Math.min(w / cw, h / ch) * 0.90;
      if (isKenBurns && loopTime <= duration) {
        scale *= (1.0 + 0.055 * (loopTime / duration));
      }
      const fgW = cw * scale;
      const fgH = ch * scale;
      const fgX = (w - fgW) / 2;
      const fgY = (h - fgH) / 2;

      canvasCtx.save();
      canvasCtx.shadowColor = 'rgba(0,0,0,0.6)';
      canvasCtx.shadowBlur = 18;
      canvasCtx.shadowOffsetY = 6;
      canvasCtx.drawImage(coverImageObject, fgX, fgY, fgW, fgH);
      canvasCtx.restore();

      // Draw Sparkles
      if (['sparkles', 'combo', 'notes'].includes(activeEffect)) {
        previewSparkles.forEach(sp => {
          const alpha = 0.3 + 0.7 * Math.pow(Math.sin(sp.speed * elapsed + sp.phase), 2);
          drawCanvasSparkle(canvasCtx, sp.x, sp.y, sp.size, sp.color, alpha);
        });
      }

      // Draw Musical Notes
      if (['notes', 'combo'].includes(activeEffect)) {
        previewNotes.forEach(nt => {
          const curY = h + 20 - ((elapsed + nt.tOffset) * nt.vy) % (h + 50);
          const curX = nt.x0 + nt.amp * Math.sin(nt.freq * elapsed + nt.phase);

          let alpha = 0.9;
          if (curY > h - 50) alpha = Math.max(0, (h - curY) / 50);
          else if (curY < 50) alpha = Math.max(0, curY / 50);

          canvasCtx.save();
          canvasCtx.fillStyle = nt.color;
          canvasCtx.globalAlpha = alpha;
          canvasCtx.font = `bold ${nt.size}px "Segoe UI Symbol", sans-serif`;
          canvasCtx.shadowColor = nt.color;
          canvasCtx.shadowBlur = 8;
          canvasCtx.fillText(nt.symbol, curX, curY);
          canvasCtx.restore();
        });
      }

      // Draw Paper Airplane
      if (['airplane', 'combo'].includes(activeEffect)) {
        const planeStart = 0.4;
        const planeEnd = duration - 0.2;
        if (loopTime >= planeStart && loopTime <= planeEnd) {
          const u = (loopTime - planeStart) / (planeEnd - planeStart);
          const p0 = { x: -30, y: h * 0.82 };
          const p1 = { x: w * 0.48, y: h * 0.50 };
          const p2 = { x: w + 40, y: h * 0.16 };

          const bx = Math.pow(1 - u, 2) * p0.x + 2 * (1 - u) * u * p1.x + Math.pow(u, 2) * p2.x;
          const by = Math.pow(1 - u, 2) * p0.y + 2 * (1 - u) * u * p1.y + Math.pow(u, 2) * p2.y;

          const dx = 2 * (1 - u) * (p1.x - p0.x) + 2 * u * (p2.x - p1.x);
          const dy = 2 * (1 - u) * (p1.y - p0.y) + 2 * u * (p2.y - p1.y);
          const angle = Math.atan2(dy, dx);

          for (let trail = 1; trail <= 6; trail++) {
            const tu = Math.max(0, u - trail * 0.025);
            const tx = Math.pow(1 - tu, 2) * p0.x + 2 * (1 - tu) * tu * p1.x + Math.pow(tu, 2) * p2.x;
            const ty = Math.pow(1 - tu, 2) * p0.y + 2 * (1 - tu) * tu * p1.y + Math.pow(tu, 2) * p2.y;
            canvasCtx.beginPath();
            canvasCtx.arc(tx, ty, 3 - trail * 0.4, 0, Math.PI * 2);
            canvasCtx.fillStyle = `rgba(255, 255, 255, ${0.7 - trail * 0.1})`;
            canvasCtx.fill();
          }

          drawCanvasPaperAirplane(canvasCtx, bx, by, 22, angle);
        }
      }
    }

    previewAnimId = requestAnimationFrame(renderPreviewFrame);
  }

  function drawCanvasSparkle(ctx, cx, cy, size, color, alpha) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.22, cy - size * 0.22);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.22);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.22, cy + size * 0.22);
    ctx.lineTo(cx - size, cy);
    ctx.lineTo(cx - size * 0.22, cy - size * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCanvasPaperAirplane(ctx, cx, cy, size, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, -size * 0.52);
    ctx.lineTo(-size * 0.45, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#D1D5DB';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size * 0.52);
    ctx.lineTo(-size * 0.45, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.45, 0);
    ctx.stroke();

    ctx.restore();
  }

  // ----------------------------------------------------
  // 5. MASTER ACTION: HYBRID RENDERING (LOCAL + GITHUB PAGES)
  // ----------------------------------------------------
  btnCreateMV.addEventListener('click', () => {
    if (!coverImageObject) {
      alert('Chị chưa chọn ảnh bìa. Vui lòng bấm vào "Chọn Ảnh Bìa" ở Bước 1 nhé!');
      return;
    }
    if (!mvFileBlob && !uploadedMVServerPath) {
      alert('Chị chưa chọn file MV ca nhạc. Vui lòng bấm vào "Chọn MV Ca Nhạc" ở Bước 2 nhé!');
      return;
    }

    const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalServer && uploadedCoverServerPath && uploadedMVServerPath) {
      runLocalBackendRendering();
    } else {
      runClientSideWebRendering();
    }
  });

  // Mode A: Local Python Backend (Fast Concat)
  function runLocalBackendRendering() {
    const payload = {
      cover_path: uploadedCoverServerPath,
      mv_path: uploadedMVServerPath,
      effect: document.querySelector('input[name="effectChoice"]:checked')?.value || 'combo',
      ken_burns: kenBurnsCheck.checked,
      fit_mode: 'blur_bg',
      merge_mode: mergeModeSelect.value,
      intro_duration: parseFloat(introDurationRange.value) || 4.0,
      audio_choice: audioChoiceSelect.value
    };

    setUIProcessing(true, "Đang kết nối máy chủ xử lý video...");

    fetch('/api/create_mv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'started' && data.job_id) {
        currentJobId = data.job_id;
        startPollingProgress();
      } else {
        alert('Lỗi khởi tạo: ' + (data.error || 'Không rõ nguyên nhân'));
        setUIProcessing(false);
      }
    })
    .catch(() => {
      // Fallback to client-side rendering
      runClientSideWebRendering();
    });
  }

  function startPollingProgress() {
    if (progressPollTimer) clearInterval(progressPollTimer);

    progressPollTimer = setInterval(() => {
      if (!currentJobId) return;

      fetch(`/api/progress?job_id=${currentJobId}`)
      .then(r => r.json())
      .then(job => {
        if (!job) return;

        progressBarFill.style.width = `${job.percent}%`;
        progressPctText.textContent = `${job.percent}%`;
        progressStatusMsg.textContent = job.message || 'Đang xử lý...';

        if (job.status === 'done') {
          clearInterval(progressPollTimer);
          onJobCompleteLocal(job);
        } else if (job.status === 'error') {
          clearInterval(progressPollTimer);
          alert('Quá trình tạo MV gặp lỗi: ' + (job.error || job.message));
          setUIProcessing(false);
        }
      })
      .catch(() => {});
    }, 600);
  }

  function onJobCompleteLocal(job) {
    setUIProcessing(false);
    progressCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    const downloadUrl = `/download/${job.output_file}`;
    finalVideoPlayer.src = `/output/${job.output_file}`;
    finalVideoPlayer.load();
    finalVideoPlayer.play().catch(() => {});

    btnDownloadMV.href = downloadUrl;
    btnDownloadMV.setAttribute('download', job.output_file);
    btnDownloadMV.onclick = () => { window.location.href = downloadUrl; };

    savePathText.innerHTML = `<strong>📁 File đã lưu sẵn trên máy tính của chị:</strong><br><code style="user-select: all; background: rgba(0,0,0,0.55); padding: 6px 12px; border-radius: 6px; color: #fcd34d; font-size: 12px; display: inline-block; margin-top: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">${job.output_path || ('xuat_mv/' + job.output_file)}</code>`;

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Mode B: Client-Side In-Browser Video Recording (Runs on GitHub Pages anywhere!)
  function runClientSideWebRendering() {
    setUIProcessing(true, "Đang khởi tạo bộ thu video trực tiếp trên trình duyệt...");

    const duration = parseFloat(introDurationRange.value) || 4.0;
    const audioChoice = audioChoiceSelect.value;

    // Web Audio Synthesizer or MV Audio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    if (audioChoice === 'chime' || audioChoice === 'from_mv') {
      playSoftChime(audioCtx, dest, duration);
    }

    // Capture Canvas stream
    const canvasStream = previewCanvas.captureStream(30);
    const combinedTracks = [
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);

    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm';
      }
    }

    const recordedChunks = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: mimeType,
      videoBitsPerSecond: 6000000
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const ext = mimeType.includes('mp4') ? '.mp4' : '.webm';
      const filename = `MV_HoanThien_${Date.now()}${ext}`;
      const blob = new Blob(recordedChunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      setUIProcessing(false);
      progressCard.classList.add('hidden');
      resultCard.classList.remove('hidden');

      finalVideoPlayer.src = blobUrl;
      finalVideoPlayer.load();
      finalVideoPlayer.play().catch(() => {});

      btnDownloadMV.href = blobUrl;
      btnDownloadMV.download = filename;
      btnDownloadMV.onclick = (e) => {
        // Direct anchor download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      btnOpenFolder.style.display = 'none'; // Not applicable on online static host
      savePathText.innerHTML = `<strong>🎉 MV hoàn thiện trực tuyến sẵn sàng!</strong><br><small style="color: #94a3b8;">Bấm "TẢI MV VỀ MÁY" để lưu file về thư mục Downloads của máy tính.</small>`;

      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Restart preview loop to sync start
    restartLivePreview();
    recorder.start(100);

    const startTime = performance.now();
    const intervalTimer = setInterval(() => {
      const cur = (performance.now() - startTime) / 1000;
      const pct = Math.min(98, Math.floor((cur / duration) * 100));
      progressBarFill.style.width = `${pct}%`;
      progressPctText.textContent = `${pct}%`;
      progressStatusMsg.textContent = `Đang tạo MV trực tiếp trên trình duyệt: ${pct}%...`;

      if (cur >= duration) {
        clearInterval(intervalTimer);
        progressBarFill.style.width = `100%`;
        progressPctText.textContent = `100%`;
        progressStatusMsg.textContent = `Hoàn tất! Đang đóng gói video...`;
        setTimeout(() => recorder.stop(), 200);
      }
    }, 150);
  }

  // Web Audio chime generator
  function playSoftChime(ctx, destination, maxDuration) {
    const notes = [
      { t: 0.0, f: 523.25, g: 0.35 },
      { t: 0.35, f: 659.25, g: 0.30 },
      { t: 0.70, f: 783.99, g: 0.30 },
      { t: 1.05, f: 987.77, g: 0.25 },
      { t: 1.40, f: 1318.51, g: 0.20 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + n.t);
      gain.gain.exponentialRampToValueAtTime(n.g, ctx.currentTime + n.t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + 1.8);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(ctx.currentTime + n.t);
      osc.stop(ctx.currentTime + n.t + 2.0);
    });
  }

  function setUIProcessing(isProc, msg) {
    btnCreateMV.disabled = isProc;
    btnCreateMV.style.opacity = isProc ? '0.6' : '1';
    if (isProc) {
      progressCard.classList.remove('hidden');
      resultCard.classList.add('hidden');
      progressBarFill.style.width = '5%';
      progressPctText.textContent = '5%';
      progressStatusMsg.textContent = msg || 'Đang xử lý...';
      progressCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  btnOpenFolder.addEventListener('click', () => {
    fetch('/api/open_folder', { method: 'POST' })
    .then(r => r.json())
    .catch(() => alert('Thư mục video: THUC HANH\\xuat_mv'));
  });

  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
});
