const RAND_LOGOS = [
    { src: 'images/01-LOGOS/logo-1.svg', w:  341,     h:  100,    contentH:  97.35, amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-2.svg', w: 1107.8,   h:  414.72, contentH: 346.54, amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-3.svg', w: 1330.66,  h:  391.4,  contentH: 383.91, amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-5.svg', w: 1057.68,  h:  267.8,  contentH: 267.8,  amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-7.svg', w:  115.43,  h:   52.18, contentH:  36.18, amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-8.svg', w: 1364.57,  h:  425.51, contentH: 310.18, amp: 0.50, stopP: 0.20 },
    { src: 'images/01-LOGOS/logo-9.svg', w: 1390.13,  h:  420.39, contentH: 409.03, amp: 0.50, stopP: 0.20 },
];
let logoIdx = 4; // default: logo-7
let LOGO = RAND_LOGOS[logoIdx];
let logoEls = RAND_LOGOS.map(() => ({ el: new Image(), loaded: false }));
let randomLogo = false;
let logoFrameTimer = 0;
const LOGO_INTERVAL = 150; // frames (~5 s at 30 fps)

let tt = 0, ttTgt = 1, frame = 0, canvas;
var ran = Math.random() * 10;
let maxDepth = 3;
let minRatio  = 0.30;

const EXTRA_IMAGES_SRC = Array.from({length: 73}, (_, i) =>
    `images/imgs/${String(i + 1).padStart(2, '0')}.png`
);
let extraImages = new Array(EXTRA_IMAGES_SRC.length).fill(null);
let imgCount     = 1;
let showImages   = false;
let showLogo     = true;
let showGrid     = false;
let showOutline  = true;
let showTextile  = false;

// ── content cells — heading SVG + text blocks ─────────────────────────────────
let headingImg  = null;    // Image element for uploaded SVG heading
let showHeading = false;
const HEADING_MIN_W = 250, HEADING_MIN_H = 80;
const TEXT_MIN_W    = 180, TEXT_MIN_H    = 100;

// Each entry: { text, el, paraEl, bounds }  (bounds filled per-frame, then reset)
let textBlocks = [];

// Per-frame claim state — reset at top of draw()
let _headingClaimed = false;
let _textClaimedIdx = 0;

let outlineEls = RAND_LOGOS.map(() => ({ el: new Image(), loaded: false }));

// ── movement mode ─────────────────────────────────────────────────────────────
let movement = 'xy'; // 'xy' | 'xyz' | 'swarm'

// autonomous swarm position
let swarmX = null, swarmY = null;
let swarmVX = 2.5, swarmVY = 1.8;
let swarmTT = 0; // dedicated slow timer for swarm animation

// grow (cell division) mode
let mitosisMap = new Map();
const MITOSIS_THRESHOLD = 150; // both w and h must exceed this (px) to trigger

// walker mode — multiple drifting points that reveal the grid
let walkers = [];
let walkerTT = 0;
const WALKER_SIGMA  = 120; // Gaussian falloff radius (px)
const WALKER_TRAIL  = 90;  // frames of position history per walker (~3 s at 30 fps)

let xyzEl = null, xyzRenderer = null, xyzScene = null, xyzCamera = null;
let xyzPool = [], xyzCellCount = 0, xyzImgPool = [];
const XYZ_POOL_SIZE = 1500;
let xyzLogoMat = null, xyzImgMats = [], xyzGridMat = null, xyzBlankMat = null;
let xyzReady = false;
let xyzCamH = 0, xyzCamV = 0; // camera orbit degrees (horizontal, vertical)

// ── setup ─────────────────────────────────────────────────────────────────────

function setup() {
    frameRate(30);
    canvas = createCanvas(window.innerWidth, window.innerHeight);

    RAND_LOGOS.forEach((def, i) => {
        logoEls[i].el.onload = () => { logoEls[i].loaded = true; };
        logoEls[i].el.src = def.src;
        outlineEls[i].el.onload = () => { outlineEls[i].loaded = true; };
        outlineEls[i].el.src = def.src.replace('01-LOGOS/', '01-LOGOS/outlined/');
    });

    EXTRA_IMAGES_SRC.forEach((src, i) => {
        let img = new Image();
        img.onload = () => { extraImages[i] = img; };
        img.src = src;
    });

    buildUI();
}

// ── draw ──────────────────────────────────────────────────────────────────────

function draw() {
    frame++;
    tt += (ttTgt - tt) / 4;
    if (frame % 30 == 0) ttTgt = frame * 2;
    if (tt % 600 == 0) ran = Math.random() * 10;

    // Sync text overlay divs to previous frame's claimed cell bounds (1 frame behind — imperceptible)
    textBlocks.forEach(tb => {
        if (!tb.el) return;
        if (tb.bounds && tb.text) {
            tb.el.style.display = 'block';
            tb.el.style.left   = tb.bounds.x + 'px';
            tb.el.style.top    = tb.bounds.y + 'px';
            tb.el.style.width  = tb.bounds.w + 'px';
            tb.el.style.height = tb.bounds.h + 'px';
        } else {
            tb.el.style.display = 'none';
        }
    });
    _headingClaimed = false;
    _textClaimedIdx = 0;
    textBlocks.forEach(tb => { tb.bounds = null; });

    // randomise logo cycling
    if (randomLogo) {
        logoFrameTimer++;
        if (logoFrameTimer >= LOGO_INTERVAL) {
            logoFrameTimer = 0;
            let next;
            do { next = Math.floor(Math.random() * RAND_LOGOS.length); } while (next === logoIdx && RAND_LOGOS.length > 1);
            switchLogo(next);
        }
    }

    if (movement === 'xyz')     { drawXYZ(); return; }
    if (movement === 'swarm')   { drawSwarm(); return; }
    if (movement === 'organic') { drawGrow(); return; }
    if (movement === 'walker')  { drawWalker(); return; }

    background(255);
    if (!logoEls[logoIdx].loaded) return;
    splitLogoImages(0, 0, canvas.width, canvas.height, 0, 0, LOGO.w, LOGO.contentH, 0, 1);
}

// ── x/y drawing ───────────────────────────────────────────────────────────────

function drawRegion(x, y, w, h, ix, iy, iw, ih) {
    if (w < 0.5 || h < 0.5 || iw < 0.01 || ih < 0.01) return;
    let ol = outlineEls[logoIdx];
    let el = (showOutline && ol.loaded) ? ol.el : logoEls[logoIdx].el;
    let scaleX = w / iw, scaleY = h / ih;
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(el, x - ix * scaleX, y - iy * scaleY, LOGO.w * scaleX, LOGO.h * scaleY);
    ctx.restore();
}

// ── textile — organic polygon shapes ──────────────────────────────────────────

// Build a smooth irregular polygon path into ctx that fits within (x,y,w,h).
// 8 perimeter points (corners + edge mids) are jitter-displaced per nodeId,
// then connected with midpoint-quadratic beziers for a natural rounded feel.
function buildOrganicPath(ctx, x, y, w, h, nodeId) {
    let m = Math.max(3, Math.min(Math.min(w, h) * 0.06, 10));
    let x1 = x + m, y1 = y + m, x2 = x + w - m, y2 = y + h - m;

    if (x2 - x1 < 6 || y2 - y1 < 6) {
        // Cell too small for polygon — draw a small ellipse instead
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.5,
                    Math.max(2, (x2 - x1) * 0.5), Math.max(2, (y2 - y1) * 0.5),
                    0, 0, Math.PI * 2);
        ctx.closePath();
        return true;
    }

    let mx = (x1 + x2) * 0.5, my = (y1 + y2) * 0.5;
    randomSeed(nodeId * 1337 + 42);
    let jit = Math.min(x2 - x1, y2 - y1) * 0.15;

    let pts = [
        [x1, y1], [mx, y1], [x2, y1],
        [x2, my],
        [x2, y2], [mx, y2], [x1, y2],
        [x1, my],
    ].map(([px, py]) => [
        px + (random() - 0.5) * 2 * jit,
        py + (random() - 0.5) * 2 * jit,
    ]);

    let n = pts.length;
    // Midpoint quadratic bezier: smooth closed polygon through jittered points
    ctx.beginPath();
    ctx.moveTo((pts[0][0] + pts[n - 1][0]) * 0.5, (pts[0][1] + pts[n - 1][1]) * 0.5);
    for (let i = 0; i < n; i++) {
        let nxt = pts[(i + 1) % n];
        ctx.quadraticCurveTo(pts[i][0], pts[i][1],
                             (pts[i][0] + nxt[0]) * 0.5, (pts[i][1] + nxt[1]) * 0.5);
    }
    ctx.closePath();
    return true;
}

// Draw a textile cell: organic polygon clipped fill + black stroke outline.
// Content priority: images → logo → white fill.
function drawTextileCell(x, y, w, h, ix, iy, iw, ih, nodeId) {
    let ctx = drawingContext;
    ctx.save();
    if (!buildOrganicPath(ctx, x, y, w, h, nodeId)) { ctx.restore(); return; }

    // Fill, clipped to organic shape
    ctx.save();
    ctx.clip();
    randomSeed(nodeId * 17 + 3331);
    let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
    if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
        let img = pool[floor(random() * pool.length)];
        let ir = img.naturalWidth / img.naturalHeight, cr = w / h;
        let dw, dh, dx, dy;
        if (ir > cr) { dh = h; dw = h * ir; dx = x - (dw - w) * 0.5; dy = y; }
        else          { dw = w; dh = w / ir; dx = x; dy = y - (dh - h) * 0.5; }
        ctx.drawImage(img, dx, dy, dw, dh);
    } else if (showLogo && logoEls[logoIdx].loaded) {
        let ol = outlineEls[logoIdx];
        let el = (showOutline && ol.loaded) ? ol.el : logoEls[logoIdx].el;
        let scaleX = w / iw, scaleY = h / ih;
        ctx.drawImage(el, x - ix * scaleX, y - iy * scaleY, LOGO.w * scaleX, LOGO.h * scaleY);
    } else {
        ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore(); // remove clip — path still live

    // Black stroke on the organic outline
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
}

function drawImageCover(img, x, y, w, h) {
    if (!img || w < 1 || h < 1) return;
    let ir = img.naturalWidth / img.naturalHeight;
    let cr = w / h;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.naturalHeight; sw = sh * cr; sx = (img.naturalWidth - sw) / 2; sy = 0; }
    else         { sw = img.naturalWidth;  sh = sw / cr; sx = 0; sy = (img.naturalHeight - sh) / 2; }
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
}

function splitLogoImages(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        if (showHeading && !_headingClaimed && headingImg && w >= HEADING_MIN_W && h >= HEADING_MIN_H) {
            _headingClaimed = true; drawHeadingCell(x, y, w, h); return;
        }
        if (_textClaimedIdx < textBlocks.length && textBlocks[_textClaimedIdx].text && w >= TEXT_MIN_W && h >= TEXT_MIN_H) {
            textBlocks[_textClaimedIdx].bounds = { x, y, w, h }; _textClaimedIdx++;
            drawTextBgCell(x, y, w, h); return;
        }
        if (showTextile) {
            drawTextileCell(x, y, w, h, ix, iy, iw, ih, nodeId);
        } else {
            randomSeed(nodeId * 17 + 3331);
            let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
            if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
                drawImageCover(pool[floor(random() * pool.length)], x, y, w, h);
            } else if (showGrid) {
                fill(255); stroke(0); strokeWeight(0.5); rect(x, y, w, h);
            } else if (showLogo) {
                drawRegion(x, y, w, h, ix, iy, iw, ih);
            } else {
                fill(255); noStroke(); rect(x, y, w, h);
            }
            if (showOutline) { noFill(); stroke(0); strokeWeight(0.5); rect(x, y, w, h); }
        }
        return;
    }
    let crx = 0.5 + amp * Math.sin(tt * (0.01 + n * 0.01) + n * 50);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(tt * (0.01 + n * 0.01) + n * 9930);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);
    let ww = w * crx,   ww2 = w * (1 - crx);
    let hh = h * cry,   hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        splitLogoImages(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0);
        splitLogoImages(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1);
        splitLogoImages(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2);
        splitLogoImages(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        splitLogoImages(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        splitLogoImages(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        splitLogoImages(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        splitLogoImages(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

// ── swarm mode ────────────────────────────────────────────────────────────────

function updateSwarm() {
    if (swarmX === null) { swarmX = canvas.width / 2; swarmY = canvas.height / 2; }
    // Small random nudge + damping for smooth wandering
    swarmVX += (Math.random() - 0.5) * 0.7;
    swarmVY += (Math.random() - 0.5) * 0.7;
    swarmVX *= 0.95;
    swarmVY *= 0.95;
    let spd = Math.sqrt(swarmVX * swarmVX + swarmVY * swarmVY);
    let minSpd = 3.0, maxSpd = 7.0;
    if (spd > maxSpd) { swarmVX *= maxSpd / spd; swarmVY *= maxSpd / spd; }
    if (spd < minSpd) { swarmVX *= minSpd / spd; swarmVY *= minSpd / spd; }
    swarmX += swarmVX;
    swarmY += swarmVY;
    if (swarmX < 0)             { swarmX = 0;             swarmVX =  Math.abs(swarmVX); }
    if (swarmX > canvas.width)  { swarmX = canvas.width;  swarmVX = -Math.abs(swarmVX); }
    if (swarmY < 0)             { swarmY = 0;             swarmVY =  Math.abs(swarmVY); }
    if (swarmY > canvas.height) { swarmY = canvas.height; swarmVY = -Math.abs(swarmVY); }
}

function drawSwarm() {
    swarmTT += 1.8; // faster tick → more cell movement
    updateSwarm();
    background(255);
    if (!logoEls[logoIdx].loaded) return;
    splitLogoMouse(0, 0, canvas.width, canvas.height, 0, 0, LOGO.w, LOGO.contentH, 0, 1);
}

function splitLogoMouse(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    // Slowly animated splits driven by swarmTT (not the global tt)
    let { amp } = LOGO;
    let crx = 0.5 + amp * Math.sin(swarmTT * 0.012 + nodeId * 0.7);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(swarmTT * 0.012 + nodeId * 1.3);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);

    // Closest point on this cell to the swarm — eliminates dead zones at split lines
    let nearX = Math.max(x, Math.min(swarmX, x + w));
    let nearY = Math.max(y, Math.min(swarmY, y + h));
    let dist = Math.sqrt((nearX - swarmX) ** 2 + (nearY - swarmY) ** 2);
    let sigma = 300;
    let influence = Math.exp(-(dist / sigma) * (dist / sigma));
    let localDepth = Math.max(1, Math.round(influence * maxDepth));

    if (n >= localDepth) {
        if (showHeading && !_headingClaimed && headingImg && w >= HEADING_MIN_W && h >= HEADING_MIN_H) {
            _headingClaimed = true; drawHeadingCell(x, y, w, h); return;
        }
        if (_textClaimedIdx < textBlocks.length && textBlocks[_textClaimedIdx].text && w >= TEXT_MIN_W && h >= TEXT_MIN_H) {
            textBlocks[_textClaimedIdx].bounds = { x, y, w, h }; _textClaimedIdx++;
            drawTextBgCell(x, y, w, h); return;
        }
        if (showTextile) {
            drawTextileCell(x, y, w, h, ix, iy, iw, ih, nodeId);
        } else {
            randomSeed(nodeId * 17 + 3331);
            let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
            if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
                drawImageCover(pool[floor(random() * pool.length)], x, y, w, h);
            } else if (showGrid) {
                fill(255); stroke(0); strokeWeight(0.5); rect(x, y, w, h);
            } else if (showLogo) {
                drawRegion(x, y, w, h, ix, iy, iw, ih);
            } else {
                fill(255); noStroke(); rect(x, y, w, h);
            }
            if (showOutline) { noFill(); stroke(0); strokeWeight(0.5); rect(x, y, w, h); }
        }
        return;
    }

    let ww = w * crx, ww2 = w * (1 - crx);
    let hh = h * cry, hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        splitLogoMouse(x,     y,    ww,  hh,  ix,      iy,      iww,  ihh,  n+1, nodeId*4+0);
        splitLogoMouse(x+ww,  y,    ww2, hh,  ix+iww,  iy,      iww2, ihh,  n+1, nodeId*4+1);
        splitLogoMouse(x,     y+hh, ww,  hh2, ix,      iy+ihh,  iww,  ihh2, n+1, nodeId*4+2);
        splitLogoMouse(x+ww,  y+hh, ww2, hh2, ix+iww,  iy+ihh,  iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        splitLogoMouse(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        splitLogoMouse(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        splitLogoMouse(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        splitLogoMouse(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

// ── grow (cell division) mode ─────────────────────────────────────────────────

function drawGrow() {
    background(255);
    if (!logoEls[logoIdx].loaded) return;
    splitLogoGrow(0, 0, canvas.width, canvas.height, 0, 0, LOGO.w, LOGO.contentH, 0, 1);
}

// Identical recursion to splitLogoImages — same animated grid — leaf nodes go through mitosis
function splitLogoGrow(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        renderLeafGrow(x, y, w, h, ix, iy, iw, ih, nodeId);
        return;
    }
    let crx = 0.5 + amp * Math.sin(tt * (0.0015 + n * 0.0015) + n * 50);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(tt * (0.0015 + n * 0.0015) + n * 9930);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);
    let ww = w * crx,   ww2 = w * (1 - crx);
    let hh = h * cry,   hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        splitLogoGrow(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0);
        splitLogoGrow(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1);
        splitLogoGrow(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2);
        splitLogoGrow(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        splitLogoGrow(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        splitLogoGrow(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        splitLogoGrow(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        splitLogoGrow(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

function renderLeafGrow(x, y, w, h, ix, iy, iw, ih, nodeId) {
    let state = mitosisMap.get(nodeId);
    if (state) {
        renderMitosisNode(state, x, y, w, h, ix, iy, iw, ih);
        return;
    }

    // Content cells take priority — prevent mitosis in claimed cells
    if (showHeading && !_headingClaimed && headingImg && w >= HEADING_MIN_W && h >= HEADING_MIN_H) {
        _headingClaimed = true; mitosisMap.delete(nodeId); drawHeadingCell(x, y, w, h); return;
    }
    if (_textClaimedIdx < textBlocks.length && textBlocks[_textClaimedIdx].text && w >= TEXT_MIN_W && h >= TEXT_MIN_H) {
        textBlocks[_textClaimedIdx].bounds = { x, y, w, h }; _textClaimedIdx++;
        mitosisMap.delete(nodeId); drawTextBgCell(x, y, w, h); return;
    }

    // Normal render this frame
    if (showTextile) {
        drawTextileCell(x, y, w, h, ix, iy, iw, ih, nodeId);
    } else {
        randomSeed(nodeId * 17 + 3331);
        let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
        if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
            drawImageCover(pool[floor(random() * pool.length)], x, y, w, h);
        } else if (showGrid) {
            fill(255); stroke(0); strokeWeight(0.5); rect(x, y, w, h);
        } else if (showLogo) {
            drawRegion(x, y, w, h, ix, iy, iw, ih);
        } else {
            fill(255); noStroke(); rect(x, y, w, h);
        }
        // Arm mitosis once the cell is large enough in both dimensions
        if (w > MITOSIS_THRESHOLD && h > MITOSIS_THRESHOLD) {
            mitosisMap.set(nodeId, {
                scale: 1.0,
                rate:  0.003 + Math.random() * 0.003,
                children: null,
                splitDir: w >= h ? 'h' : 'v'
            });
        }
    }
}

// Recursive mitosis tree: each node zooms its content 1→2× then spawns two children
// that both show the same locked logo region (ix, iy, iw, ih)
function renderMitosisNode(state, x, y, w, h, ix, iy, iw, ih) {
    if (!state.children) {
        state.scale += state.rate;
        if (state.scale >= 2.0) {
            let childMin = state.splitDir === 'h' ? w / 2 : h / 2;
            if (childMin >= 35) {
                let next = state.splitDir === 'h' ? 'v' : 'h';
                state.children = [
                    { scale: 1.0, rate: 0.002 + Math.random() * 0.003, children: null, splitDir: next },
                    { scale: 1.0, rate: 0.002 + Math.random() * 0.003, children: null, splitDir: next }
                ];
            } else {
                state.scale = 1.0; // too small to split — pulse indefinitely
            }
        }
        renderZoomedContent(x, y, w, h, ix, iy, iw, ih, state.scale);
    } else {
        if (state.splitDir === 'h') {
            renderMitosisNode(state.children[0], x,       y, w / 2, h,     ix, iy, iw, ih);
            renderMitosisNode(state.children[1], x + w/2, y, w / 2, h,     ix, iy, iw, ih);
        } else {
            renderMitosisNode(state.children[0], x, y,       w, h / 2, ix, iy, iw, ih);
            renderMitosisNode(state.children[1], x, y + h/2, w, h / 2, ix, iy, iw, ih);
        }
    }
}

function renderZoomedContent(x, y, w, h, ix, iy, iw, ih, s) {
    // Show region (ix,iy,iw,ih) zoomed by s, centred within the cell
    let viw = iw / s, vih = ih / s;
    let vix = ix + (iw - viw) / 2;
    let viy = iy + (ih - vih) / 2;
    drawRegion(x, y, w, h, vix, viy, viw, vih);
}

// ── walker mode ───────────────────────────────────────────────────────────────

function initWalkers() {
    walkers = [];
    for (let i = 0; i < 4; i++) {
        walkers.push({
            x:  canvas.width  * (0.2 + 0.6 * Math.random()),
            y:  canvas.height * (0.2 + 0.6 * Math.random()),
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            trail: [],
        });
    }
}

function updateWalkers() {
    const MIN_SPD = 0.8, MAX_SPD = 2.0;
    for (let w of walkers) {
        // Gentle random drift (droplet-on-leaf feel)
        w.vx += (Math.random() - 0.5) * 0.25;
        w.vy += (Math.random() - 0.5) * 0.25;
        w.vx *= 0.97;
        w.vy *= 0.97;
        let spd = Math.sqrt(w.vx * w.vx + w.vy * w.vy);
        if (spd > MAX_SPD) { w.vx *= MAX_SPD / spd; w.vy *= MAX_SPD / spd; }
        if (spd < MIN_SPD) { w.vx *= MIN_SPD / spd; w.vy *= MIN_SPD / spd; }
        w.x += w.vx;
        w.y += w.vy;
        if (w.x < 0)             { w.x = 0;             w.vx =  Math.abs(w.vx); }
        if (w.x > canvas.width)  { w.x = canvas.width;  w.vx = -Math.abs(w.vx); }
        if (w.y < 0)             { w.y = 0;             w.vy =  Math.abs(w.vy); }
        if (w.y > canvas.height) { w.y = canvas.height; w.vy = -Math.abs(w.vy); }
        w.trail.push({ x: w.x, y: w.y });
        if (w.trail.length > WALKER_TRAIL) w.trail.shift();
    }
}

// Gaussian influence at nearest point of a cell rect, accumulated across each walker's trail.
// Older trail positions get lower weight so the trail fades behind the walker.
function walkerInfluence(x, y, w, h) {
    let maxInf = 0;
    let sig2 = WALKER_SIGMA * WALKER_SIGMA;
    for (let wk of walkers) {
        let n = wk.trail.length;
        for (let t = 0; t < n; t++) {
            let weight = Math.sqrt((t + 1) / n); // 0 (oldest) → 1 (newest)
            let pos = wk.trail[t];
            let nearX = Math.max(x, Math.min(pos.x, x + w));
            let nearY = Math.max(y, Math.min(pos.y, y + h));
            let d2 = (nearX - pos.x) ** 2 + (nearY - pos.y) ** 2;
            let inf = weight * Math.exp(-d2 / sig2);
            if (inf > maxInf) maxInf = inf;
        }
    }
    return maxInf;
}

function drawWalker() {
    walkerTT += 0.5;
    if (walkers.length === 0) initWalkers();
    updateWalkers();
    background(255);
    if (!logoEls[logoIdx].loaded) return;
    splitLogoWalker(0, 0, canvas.width, canvas.height, 0, 0, LOGO.w, LOGO.contentH, 0, 1);
}

// Same grid recursion as grow mode (slow ambient) — leaf decides visibility per walker zone
function splitLogoWalker(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        renderLeafWalker(x, y, w, h, ix, iy, iw, ih, nodeId);
        return;
    }
    let crx = 0.5 + amp * Math.sin(walkerTT * (0.003 + n * 0.003) + n * 50);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(walkerTT * (0.003 + n * 0.003) + n * 9930);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);
    let ww = w * crx,   ww2 = w * (1 - crx);
    let hh = h * cry,   hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        splitLogoWalker(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0);
        splitLogoWalker(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1);
        splitLogoWalker(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2);
        splitLogoWalker(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        splitLogoWalker(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        splitLogoWalker(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        splitLogoWalker(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        splitLogoWalker(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

function renderLeafWalker(x, y, w, h, ix, iy, iw, ih, nodeId) {
    // Content cells always visible — check before walker influence gating
    if (showHeading && !_headingClaimed && headingImg && w >= HEADING_MIN_W && h >= HEADING_MIN_H) {
        _headingClaimed = true; drawHeadingCell(x, y, w, h); return;
    }
    if (_textClaimedIdx < textBlocks.length && textBlocks[_textClaimedIdx].text && w >= TEXT_MIN_W && h >= TEXT_MIN_H) {
        textBlocks[_textClaimedIdx].bounds = { x, y, w, h }; _textClaimedIdx++;
        drawTextBgCell(x, y, w, h); return;
    }

    let inf = walkerInfluence(x, y, w, h);

    if (inf < 0.05) {
        // Far outside walker — fully blank
        fill(255); noStroke(); rect(x, y, w, h);
        return;
    }

    if (inf < 0.30) {
        // Border zone: the walker's edge IS the grid line.
        // Show only the cell outline so walker boundary and grid lines merge.
        fill(255); stroke(0); strokeWeight(0.5); rect(x, y, w, h);
        return;
    }

    // Inside walker — full content reveal
    if (showTextile) {
        drawTextileCell(x, y, w, h, ix, iy, iw, ih, nodeId);
        return;
    }
    randomSeed(nodeId * 17 + 3331);
    let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
    if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
        drawImageCover(pool[floor(random() * pool.length)], x, y, w, h);
    } else if (showGrid) {
        fill(255); stroke(0); strokeWeight(0.5); rect(x, y, w, h);
    } else if (showLogo) {
        drawRegion(x, y, w, h, ix, iy, iw, ih);
    } else {
        fill(255); noStroke(); rect(x, y, w, h);
    }
    if (showOutline) { noFill(); stroke(0); strokeWeight(0.5); rect(x, y, w, h); }
}

// ── x/y/z Three.js depth mode ─────────────────────────────────────────────────

function setupXYZ() {
    if (xyzReady) return;
    if (!logoEls[logoIdx].loaded) return;

    // Logo texture: draw SVG to offscreen canvas at high res
    let texW = 2048, texH = Math.max(1, Math.round(2048 * LOGO.h / LOGO.w));
    let oc = document.createElement('canvas');
    oc.width = texW; oc.height = texH;
    let octx = oc.getContext('2d');
    octx.fillStyle = '#fff';
    octx.fillRect(0, 0, texW, texH);
    octx.drawImage(logoEls[logoIdx].el, 0, 0, texW, texH);

    // Snap every pixel to pure black or white — removes SVG anti-aliasing gradient
    let px = octx.getImageData(0, 0, texW, texH);
    for (let i = 0; i < px.data.length; i += 4) {
        let v = (px.data[i] + px.data[i+1] + px.data[i+2]) / 3 > 128 ? 255 : 0;
        px.data[i] = px.data[i+1] = px.data[i+2] = v;
        px.data[i+3] = 255;
    }
    octx.putImageData(px, 0, 0);

    let logoTex = new THREE.CanvasTexture(oc);
    logoTex.magFilter = THREE.NearestFilter;
    logoTex.minFilter = THREE.NearestFilter;
    xyzLogoMat  = new THREE.MeshBasicMaterial({ map: logoTex });
    xyzGridMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });
    xyzBlankMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Pre-create image textures for already-loaded images
    for (let i = 0; i < extraImages.length; i++) {
        xyzImgMats[i] = null; // lazy — created on first use
    }

    // Overlay canvas
    xyzEl = document.createElement('canvas');
    css(xyzEl, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', display: 'none', pointerEvents: 'none', zIndex: '5' });
    document.body.appendChild(xyzEl);

    xyzRenderer = new THREE.WebGLRenderer({ canvas: xyzEl, antialias: true });
    xyzRenderer.setSize(window.innerWidth, window.innerHeight);
    xyzRenderer.setPixelRatio(window.devicePixelRatio || 1);

    xyzScene = new THREE.Scene();
    xyzScene.background = new THREE.Color(0xffffff);

    let fov = 60;
    let d = (window.innerHeight / 2) / Math.tan((fov / 2) * Math.PI / 180);
    xyzCamera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, d * 10);
    xyzCamera.position.set(0, 0, d);

    for (let i = 0; i < XYZ_POOL_SIZE; i++) {
        let geo = new THREE.PlaneGeometry(1, 1);
        let mesh = new THREE.Mesh(geo, xyzBlankMat);
        mesh.visible = false;
        xyzScene.add(mesh);
        xyzPool.push({ mesh, geo });
    }

    xyzReady = true;
    if (movement === 'xyz') xyzEl.style.display = 'block';
}

function drawXYZ() {
    if (!xyzReady || !logoEls[logoIdx].loaded) { if (!xyzReady) setupXYZ(); return; }

    // Orbit camera around scene based on h/v sliders
    let fov = 60;
    let d = (window.innerHeight / 2) / Math.tan((fov / 2) * Math.PI / 180);
    let theta = xyzCamH * Math.PI / 180;
    let phi   = xyzCamV * Math.PI / 180;
    xyzCamera.position.set(
        Math.sin(theta) * Math.cos(phi) * d,
        Math.sin(phi) * d,
        Math.cos(theta) * Math.cos(phi) * d
    );
    xyzCamera.lookAt(0, 0, 0);

    // Build active image index pool (mirrors splitLogoImages pool logic)
    xyzImgPool = [];
    for (let i = 0; i < imgCount && i < extraImages.length; i++) {
        if (extraImages[i] !== null) xyzImgPool.push(i);
    }

    xyzCellCount = 0;
    collectXYZ(0, 0, canvas.width, canvas.height, 0, 0, LOGO.w, LOGO.contentH, 0, 1);
    for (let i = xyzCellCount; i < xyzPool.length; i++) xyzPool[i].mesh.visible = false;
    xyzRenderer.render(xyzScene, xyzCamera);
}

function collectXYZ(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        if (xyzCellCount >= XYZ_POOL_SIZE) return;
        let { mesh, geo } = xyzPool[xyzCellCount++];
        mesh.visible = true;

        // Screen → Three.js coords, plus z oscillation per cell
        mesh.position.set(
            (x + w / 2) - canvas.width / 2,
            canvas.height / 2 - (y + h / 2),
            200 * Math.sin(tt * 0.008 + nodeId * 0.73)
        );
        mesh.scale.set(w, h, 1);

        // Determine content (same random sequence as splitLogoImages)
        randomSeed(nodeId * 17 + 3331);
        if (showImages && xyzImgPool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
            let imgIdx = xyzImgPool[floor(random() * xyzImgPool.length)];
            // Lazy-create image material
            if (!xyzImgMats[imgIdx] && extraImages[imgIdx]) {
                let t = new THREE.Texture(extraImages[imgIdx]);
                t.needsUpdate = true;
                xyzImgMats[imgIdx] = new THREE.MeshBasicMaterial({ map: t });
            }
            mesh.material = xyzImgMats[imgIdx] || xyzBlankMat;
            // Cover-crop UVs
            let img = extraImages[imgIdx];
            let ir = img.naturalWidth / img.naturalHeight, cr = w / h;
            let u0, u1, v0, v1;
            if (ir > cr) {
                u0 = 0.5 - cr / (2 * ir); u1 = 0.5 + cr / (2 * ir);
                v0 = 0; v1 = 1;
            } else {
                u0 = 0; u1 = 1;
                let vy0 = 0.5 - ir / (2 * cr), vy1 = 0.5 + ir / (2 * cr);
                v0 = 1 - vy1; v1 = 1 - vy0;
            }
            setUV(geo, u0, u1, v0, v1);
        } else if (showGrid) {
            mesh.material = xyzGridMat;
            setUV(geo, 0, 1, 0, 1);
        } else if (showLogo) {
            mesh.material = xyzLogoMat;
            setUV(geo, ix / LOGO.w, (ix + iw) / LOGO.w,
                       1 - (iy + ih) / LOGO.h, 1 - iy / LOGO.h);
        } else {
            mesh.material = xyzBlankMat;
        }
        return;
    }
    let crx = 0.5 + amp * Math.sin(tt * (0.01 + n * 0.01) + n * 50);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(tt * (0.01 + n * 0.01) + n * 9930);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);
    let ww = w * crx, ww2 = w * (1 - crx);
    let hh = h * cry, hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        collectXYZ(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0);
        collectXYZ(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1);
        collectXYZ(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2);
        collectXYZ(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        collectXYZ(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        collectXYZ(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        collectXYZ(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        collectXYZ(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

function setUV(geo, u0, u1, v0, v1) {
    let uv = geo.attributes.uv.array;
    uv[0] = u0; uv[1] = v1;
    uv[2] = u1; uv[3] = v1;
    uv[4] = u0; uv[5] = v0;
    uv[6] = u1; uv[7] = v0;
    geo.attributes.uv.needsUpdate = true;
}

function switchLogo(idx) {
    logoIdx = idx;
    LOGO = RAND_LOGOS[idx];
    swarmX = null;
    if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
}

function rebuildXYZLogoTex() {
    let texW = 2048, texH = Math.max(1, Math.round(2048 * LOGO.h / LOGO.w));
    let oc = document.createElement('canvas');
    oc.width = texW; oc.height = texH;
    let octx = oc.getContext('2d');
    octx.fillStyle = '#fff';
    octx.fillRect(0, 0, texW, texH);
    octx.drawImage(logoEls[logoIdx].el, 0, 0, texW, texH);
    let px = octx.getImageData(0, 0, texW, texH);
    for (let i = 0; i < px.data.length; i += 4) {
        let v = (px.data[i] + px.data[i+1] + px.data[i+2]) / 3 > 128 ? 255 : 0;
        px.data[i] = px.data[i+1] = px.data[i+2] = v; px.data[i+3] = 255;
    }
    octx.putImageData(px, 0, 0);
    let newTex = new THREE.CanvasTexture(oc);
    newTex.magFilter = THREE.NearestFilter;
    newTex.minFilter = THREE.NearestFilter;
    let oldTex = xyzLogoMat.map;
    xyzLogoMat.map = newTex;
    xyzLogoMat.needsUpdate = true;
    if (oldTex) oldTex.dispose();
}

// ── content-cell helpers ──────────────────────────────────────────────────────

function drawHeadingCell(x, y, w, h) {
    let ctx = drawingContext;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    if (headingImg && headingImg.complete && headingImg.naturalWidth > 0) {
        let iw = headingImg.naturalWidth || 300, ih = headingImg.naturalHeight || 150;
        let pad = 12, availW = w - 2 * pad, availH = h - 2 * pad;
        let ir = iw / ih, cr = availW / availH;
        let dw = ir > cr ? availW : availH * ir;
        let dh = ir > cr ? availW / ir : availH;
        ctx.drawImage(headingImg, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
    if (showOutline) { noFill(); stroke(0); strokeWeight(0.5); rect(x, y, w, h); }
}

function drawTextBgCell(x, y, w, h) {
    // White rectangle — the HTML overlay provides the actual text rendering
    fill(255); noStroke(); rect(x, y, w, h);
    if (showOutline) { noFill(); stroke(0); strokeWeight(0.5); rect(x, y, w, h); }
}

// Create a new text block entry with its own absolutely-positioned HTML overlay.
function addTextBlock(initialText) {
    let el = document.createElement('div');
    css(el, {
        position: 'fixed', display: 'none', overflow: 'hidden',
        background: '#ffffff', padding: '12px', boxSizing: 'border-box',
        containerType: 'inline-size', pointerEvents: 'none', zIndex: '4',
    });
    let p = document.createElement('p');
    // clamp(min, fluid-via-container-query, max) — scales with cell width
    p.style.cssText = [
        'margin:0',
        'font-size:clamp(14px, 4.2cqi, 33px)',
        'line-height:1.5',
        'overflow-wrap:break-word',
        'word-break:break-word',
        'font-family:sans-serif',
        'color:#111',
        'text-wrap:pretty',
    ].join(';');
    p.textContent = initialText || '';
    el.appendChild(p);
    document.body.appendChild(el);
    let tb = { text: initialText || '', el, paraEl: p, bounds: null };
    textBlocks.push(tb);
    return tb;
}

// ── UI ────────────────────────────────────────────────────────────────────────

function buildUI() {
    let panel = document.createElement('div');
    css(panel, {
        position: 'fixed', top: '16px', right: '16px', zIndex: '10',
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'rgba(200,200,200,0.85)', padding: '10px 12px',
        borderRadius: '10px', fontFamily: 'monospace', fontSize: '10px',
        color: '#222', userSelect: 'none', width: '130px'
    });

    let title = document.createElement('div');
    title.textContent = 'Tool';
    css(title, { fontWeight: 'bold', opacity: '0.7' });
    panel.appendChild(title);

    // Movement toggle — 2×2 grid
    let slicesCtrl, cellCtrl, imagesSliderCtrl, imagesCtrl, outlineCtrl, randomLogoCtrl, camHCtrl, camVCtrl; // forward refs for per-mode defaults
    let movRow = document.createElement('div');
    css(movRow, { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    [['x/y','xy'], ['x/y/z','xyz'], ['swarm','swarm'], ['grow','organic'], ['walk','walker']].forEach(([label, modeKey]) => {
        let btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.mode = modeKey;
        css(btn, {
            flex: '1 1 calc(50% - 4px)', padding: '3px 0', border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px',
            cursor: 'pointer', background: btn.dataset.mode === movement
                ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)'
        });
        btn.addEventListener('click', () => {
            movement = btn.dataset.mode;
            movRow.querySelectorAll('button').forEach(b => {
                b.style.background = b.dataset.mode === movement
                    ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)';
            });
            if (movement === 'xyz') {
                setupXYZ();
                if (xyzEl) xyzEl.style.display = 'block';
                camSection.style.display = 'flex';
                camHCtrl.set(15); camVCtrl.set(0);
                slicesCtrl.set(3);  cellCtrl.set(0.15); imagesSliderCtrl.set(73);
                imagesCtrl.set(true); outlineCtrl.set(false); randomLogoCtrl.set(true);
            } else {
                if (xyzEl) xyzEl.style.display = 'none';
                camSection.style.display = 'none';
                if (movement === 'xy') {
                    slicesCtrl.set(5);  cellCtrl.set(0.10); imagesSliderCtrl.set(14);
                    imagesCtrl.set(true); outlineCtrl.set(false); randomLogoCtrl.set(true);
                }
                if (movement === 'swarm') {
                    swarmX = null;
                    slicesCtrl.set(6);  cellCtrl.set(0.25); imagesSliderCtrl.set(6);
                    imagesCtrl.set(true); outlineCtrl.set(true); randomLogoCtrl.set(true);
                }
                if (movement === 'organic') {
                    mitosisMap.clear();
                    slicesCtrl.set(5);  cellCtrl.set(0.20); imagesSliderCtrl.set(5);
                    imagesCtrl.set(false); outlineCtrl.set(true); randomLogoCtrl.set(true);
                }
                if (movement === 'walker')  {
                    walkers = []; walkerTT = 0;
                    slicesCtrl.set(12); cellCtrl.set(0.45);
                }
            }
        });
        movRow.appendChild(btn);
    });
    panel.appendChild(movRow);

    // Camera orbit sliders — only visible in xyz mode
    let camSection = document.createElement('div');
    css(camSection, { display: 'none', flexDirection: 'column', gap: '6px' });
    camHCtrl = addSliderRow(camSection, 'h-rotate', -45, 45, xyzCamH, 1, v => { xyzCamH = v; });
    camVCtrl = addSliderRow(camSection, 'v-tilt',   -45, 45, xyzCamV, 1, v => { xyzCamV = v; });
    panel.appendChild(camSection);

    let hr0 = document.createElement('div');
    css(hr0, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr0);

    slicesCtrl      = addSliderRow(panel, 'slices',    2,   12,                    maxDepth, 1,    v => { maxDepth = v; });
    cellCtrl        = addSliderRow(panel, 'cell size', 0, 0.45,                   minRatio, 0.01, v => { minRatio = v; });
    imagesSliderCtrl= addSliderRow(panel, 'images',    1, EXTRA_IMAGES_SRC.length, imgCount, 1,    v => { imgCount = v; });

    let hr1 = document.createElement('div');
    css(hr1, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr1);

    imagesCtrl     = addCheckbox(panel, 'images',        showImages,  v => { showImages = v; });
                     addCheckbox(panel, 'logo',           showLogo,    v => { showLogo = v; });
                     addCheckbox(panel, 'grid lines',     showGrid,    v => { showGrid = v; });
                     addCheckbox(panel, 'textile',        showTextile, v => { showTextile = v; });
    outlineCtrl    = addCheckbox(panel, 'outline',        showOutline, v => { showOutline = v; });
    randomLogoCtrl = addCheckbox(panel, 'randomise logo', randomLogo, v => {
        randomLogo = v;
        logoFrameTimer = 0;
        if (!v) switchLogo(4); // revert to logo-7 when unchecked
    });

    // ── Content cells section ─────────────────────────────────────────────────
    let hr2 = document.createElement('hr');
    css(hr2, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr2);

    // SVG heading
    let headingRow = document.createElement('div');
    css(headingRow, { display: 'flex', alignItems: 'center', gap: '6px' });
    let headingCb = document.createElement('input');
    headingCb.type = 'checkbox'; headingCb.checked = showHeading;
    headingCb.addEventListener('change', () => { showHeading = headingCb.checked; });
    let headingLabel = document.createElement('label');
    headingLabel.textContent = 'heading svg';
    css(headingLabel, { fontSize: '11px', cursor: 'pointer' });
    headingLabel.addEventListener('click', () => { headingCb.click(); });
    let headingInput = document.createElement('input');
    headingInput.type = 'file'; headingInput.accept = '.svg,image/svg+xml';
    css(headingInput, { fontSize: '10px', flex: '1', minWidth: '0' });
    headingInput.addEventListener('change', () => {
        let file = headingInput.files[0];
        if (!file) return;
        let url = URL.createObjectURL(file);
        let img = new Image();
        img.onload = () => { headingImg = img; showHeading = true; headingCb.checked = true; };
        img.src = url;
    });
    headingRow.appendChild(headingCb);
    headingRow.appendChild(headingLabel);
    headingRow.appendChild(headingInput);
    panel.appendChild(headingRow);

    // Text blocks container
    let textBlocksDiv = document.createElement('div');
    css(textBlocksDiv, { display: 'flex', flexDirection: 'column', gap: '4px' });
    panel.appendChild(textBlocksDiv);

    function addTextBlockUI(tb) {
        let row = document.createElement('div');
        css(row, { display: 'flex', alignItems: 'flex-start', gap: '4px' });

        let ta = document.createElement('textarea');
        ta.rows = 3;
        ta.value = tb.text;
        css(ta, { flex: '1', fontSize: '10px', resize: 'vertical', minHeight: '40px', fontFamily: 'sans-serif' });
        ta.addEventListener('input', () => { tb.text = ta.value; if (tb.paraEl) tb.paraEl.textContent = ta.value; });

        let removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        css(removeBtn, { fontSize: '10px', padding: '2px 4px', cursor: 'pointer', alignSelf: 'flex-start' });
        removeBtn.addEventListener('click', () => {
            let idx = textBlocks.indexOf(tb);
            if (idx !== -1) { textBlocks.splice(idx, 1); }
            if (tb.el) tb.el.remove();
            textBlocksDiv.removeChild(row);
        });

        row.appendChild(ta);
        row.appendChild(removeBtn);
        textBlocksDiv.appendChild(row);
    }

    // Default one text block
    let defaultTb = addTextBlock('Add your description text here.');
    addTextBlockUI(defaultTb);

    let addTextBtn = document.createElement('button');
    addTextBtn.textContent = '+ add text block';
    css(addTextBtn, { fontSize: '11px', padding: '3px 6px', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '2px' });
    addTextBtn.addEventListener('click', () => {
        let tb = addTextBlock('');
        addTextBlockUI(tb);
    });
    panel.appendChild(addTextBtn);
    // ── end content cells ─────────────────────────────────────────────────────

    document.body.appendChild(panel);
}

function addSliderRow(parent, label, min, max, val, step, onChange) {
    let wrap = document.createElement('div');
    css(wrap, { display: 'flex', flexDirection: 'column', gap: '2px' });

    let header = document.createElement('div');
    css(header, { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' });

    let name = document.createElement('span');
    name.textContent = label; css(name, { opacity: '0.6' });
    header.appendChild(name);

    let valLabel = document.createElement('span');
    valLabel.textContent = step < 1 ? parseFloat(val).toFixed(2) : val;
    css(valLabel, { opacity: '0.5' });
    header.appendChild(valLabel);
    wrap.appendChild(header);

    let slider = document.createElement('input');
    slider.type = 'range'; slider.min = min; slider.max = max;
    slider.value = val; slider.step = step;
    css(slider, { width: '100%', cursor: 'pointer', margin: '0' });
    slider.addEventListener('input', () => {
        let v = parseFloat(slider.value); onChange(v);
        valLabel.textContent = step < 1 ? v.toFixed(2) : v;
    });
    wrap.appendChild(slider);
    parent.appendChild(wrap);
    return {
        set(v) {
            slider.value = v;
            valLabel.textContent = step < 1 ? parseFloat(v).toFixed(2) : v;
            onChange(parseFloat(v));
        }
    };
}

function addCheckbox(parent, label, val, onChange) {
    let wrap = document.createElement('label');
    css(wrap, { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: '0.8' });
    let cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = val;
    cb.addEventListener('change', () => onChange(cb.checked));
    wrap.appendChild(cb);
    let txt = document.createElement('span');
    txt.textContent = label;
    wrap.appendChild(txt);
    parent.appendChild(wrap);
    return { set(v) { cb.checked = v; onChange(v); } };
}

function css(el, styles) {
    Object.assign(el.style, styles);
}
