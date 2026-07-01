// ── logo sets — one per folder ────────────────────────────────────────────────
const LOGO_SETS = {
    sap: [
        { src: 'images/01-LOGOS/logo-1.svg', w:  341,     h:  100,    contentH:  97.35, amp: 0.50, stopP: 0.20 },
        { src: 'images/01-LOGOS/logo-2.svg', w: 1107.8,   h:  414.72, contentH: 346.54, amp: 0.50, stopP: 0.20 },
        { src: 'images/01-LOGOS/logo-3.svg', w: 1330.66,  h:  391.4,  contentH: 383.91, amp: 0.50, stopP: 0.20 },
        { src: 'images/01-LOGOS/logo-4.svg', w: 1364.57,  h:  425.51, contentH: 310.18, amp: 0.50, stopP: 0.20 },
        { src: 'images/01-LOGOS/logo-5.svg', w: 1390.13,  h:  420.39, contentH: 409.03, amp: 0.50, stopP: 0.20 },
    ],
    mitsap: [
        { src: 'images/02-LOGOS/mit-sap-01.svg', w: 230.4,  h: 62.85, contentH: 62.85, amp: 0.50, stopP: 0.20 },
        { src: 'images/02-LOGOS/mit-sap-02.svg', w: 225.09, h: 59.2,  contentH: 59.2,  amp: 0.50, stopP: 0.20 },
        { src: 'images/02-LOGOS/mit-sap-03.svg', w: 230.4,  h: 55.79, contentH: 55.79, amp: 0.50, stopP: 0.20 },
        { src: 'images/02-LOGOS/mit-sap-04.svg', w: 230.4,  h: 54.01, contentH: 54.01, amp: 0.50, stopP: 0.20 },
        { src: 'images/02-LOGOS/mit-sap-05.svg', w: 225.09, h: 59.2,  contentH: 59.2,  amp: 0.50, stopP: 0.20 },
    ],
    full: [
        { src: 'images/03-LOGOS/full-01.svg', w: 381.99, h: 162.85, contentH: 162.85, amp: 0.50, stopP: 0.20 },
        { src: 'images/03-LOGOS/full-02.svg', w: 381.99, h: 141.76, contentH: 141.76, amp: 0.50, stopP: 0.20 },
        { src: 'images/03-LOGOS/full-03.svg', w: 381.99, h: 141.76, contentH: 141.76, amp: 0.50, stopP: 0.20 },
        { src: 'images/03-LOGOS/full-04.svg', w: 381.99, h: 141.76, contentH: 141.76, amp: 0.50, stopP: 0.20 },
        { src: 'images/03-LOGOS/full-05.svg', w: 381.99, h: 162.85, contentH: 162.85, amp: 0.50, stopP: 0.20 },
    ],
};

// Pre-load images for all sets at startup so switching is instant
const LOGO_EL_SETS    = {};
const OUTLINE_EL_SETS = {};
Object.keys(LOGO_SETS).forEach(k => {
    LOGO_EL_SETS[k]    = LOGO_SETS[k].map(() => ({ el: new Image(), loaded: false }));
    OUTLINE_EL_SETS[k] = LOGO_SETS[k].map(() => ({ el: new Image(), loaded: false }));
});

let activeLogoSetKey = 'sap';
let RAND_LOGOS = LOGO_SETS[activeLogoSetKey];
let logoIdx    = 0; // default within sap set (logo-1)
let LOGO       = RAND_LOGOS[logoIdx];
let logoEls    = LOGO_EL_SETS[activeLogoSetKey];
let randomLogo = false;
let logoFrameTimer = 0;
const LOGO_INTERVAL = 150; // frames (~5 s at 30 fps)
let _logoShuffleQueue = [];

let tt = 0, ttTgt = 1, frame = 0, canvas;
let paused = false;
var ran = Math.random() * 10;
let maxDepth = 3;
let minRatio  = 0.30;

const EXTRA_IMAGES_SRC = [
    'images/imgs/01.png', 'images/imgs/02.png', 'images/imgs/03.jpg', 'images/imgs/03.png',
    'images/imgs/04.png', 'images/imgs/05.png', 'images/imgs/06.jpg', 'images/imgs/07.jpg',
    'images/imgs/08.jpg', 'images/imgs/09.png', 'images/imgs/10.png', 'images/imgs/11.png',
    'images/imgs/12.png', 'images/imgs/13.png', 'images/imgs/14.png', 'images/imgs/15.png',
    'images/imgs/16.png', 'images/imgs/17.png', 'images/imgs/18.png', 'images/imgs/19.png',
    'images/imgs/20.png', 'images/imgs/21.png', 'images/imgs/22.png', 'images/imgs/23.jpg',
    'images/imgs/24.jpg', 'images/imgs/25.jpg', 'images/imgs/26.jpg', 'images/imgs/27.jpg',
    'images/imgs/28.jpg',
];
let extraImages = new Array(EXTRA_IMAGES_SRC.length).fill(null);
let imgCount     = 1;
let showImages   = false;
let showLogo     = true;
let showGrid      = false;
let showLinesLogo = false;
let showOutline   = false;
let logoScale     = 1.0;
let showVoronoi   = false;
let logoOnly      = false; // Swarm/Grow: skip white cells, show revealed logo only
const COLOR_PRESETS = [
    { bg: '#292924', logo: '#72df43' },
    { bg: '#ADBADD', logo: '#D6EE28' },
    { bg: '#2B3656', logo: '#5B83FB' },
    { bg: '#BDBBAE', logo: '#D3D1CB' },
    { bg: '#8B7A5F', logo: '#0147B6' },
    { bg: '#A2907A', logo: '#F85C04' },
];
let { bg: bgColor, logo: logoColor } = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];

// ── content cells — heading SVG + text blocks ─────────────────────────────────
let headingImgs = [];      // Array of Image elements for uploaded SVG headings
const HEADING_MIN_W = 350, HEADING_MIN_H = 130;
const TEXT_MIN_SIZES = [
    { w: 280, h: 150 },  // H2 – first text block
    { w: 210, h: 120 },  // H3 – second text block
    { w: 160, h:  90 },  // H4 – third+ text blocks
];

// Each entry: { text, el, paraEl, bounds }  (bounds filled per-frame, then reset)
let textBlocks = [];

// Per-frame claim state — reset at top of draw()
let _headingClaimedIdx = 0;
let _textClaimedIdx = 0;

let outlineEls = OUTLINE_EL_SETS[activeLogoSetKey];

// ── movement mode ─────────────────────────────────────────────────────────────
let movement = 'xy'; // 'xy' | 'xyz' | 'swarm'

// autonomous swarm position
let swarmPoints = [];
let swarmTT = 0; // dedicated slow timer for swarm animation

// grow (cell division) mode
let mitosisMap = new Map();
const MITOSIS_THRESHOLD = 150; // both w and h must exceed this (px) to trigger

// expand mode — static origin points, narrow roots shoot outward and fade behind tip
let expanders = [];
let expandTT  = 0;
let burstTT         = 0;
let burstDroplets   = [];
let burstSeedCache  = [];
let burstCanvas     = null;
let burstCanvasKey  = '';
let burstSpawnTimer = 0;
let burstAttractors = [];
const BURST_SPAWN_INTERVAL = 4;    // frames between spawn batches
const BURST_SPAWN_COUNT    = 3;    // droplets per batch
const BURST_MAX_DROPLETS   = 320;  // hard cap — fills 6 clusters of ~50+
const BURST_SIZE_SCALE     = 2.2;  // multiply seed cell size for bigger droplets
const BURST_MAX_DROP_SIZE  = 55;   // hard cap on longest dimension (px)
const BURST_WIGGLE_AMP     = 3.5;  // px radius of settled cluster buzz
const BURST_MIN_SPEED      = 0.6;  // px/frame
const BURST_MAX_SPEED      = 3.8;  // px/frame
const BURST_WOBBLE         = 0.04; // max angle drift per frame
const BURST_SPLIT_P        = 0.005;// probability of splitting per frame
const EXPAND_ROOT_SPEED  = 2.2;   // px per frame tip growth
const EXPAND_ROOT_SIGMA  = 130;   // Gaussian width of each root (px)
const EXPAND_ROOT_TRAIL  = 180;   // frames of trail per arm (longer = fades later)
const EXPAND_ROOT_COUNT  = 5;     // arms per expander
const EXPAND_ROOT_CURVE  = 0.012; // max angular drift per frame (organic curvature)


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
    let faceStyle = document.createElement('style');
    faceStyle.textContent = "@font-face { font-family: 'TimesNowLight'; src: url('fonts/Times Now Light.otf') format('opentype'); }";
    document.head.appendChild(faceStyle);

    Object.keys(LOGO_SETS).forEach(k => {
        LOGO_SETS[k].forEach((def, i) => {
            LOGO_EL_SETS[k][i].el.onload = () => { LOGO_EL_SETS[k][i].loaded = true; };
            LOGO_EL_SETS[k][i].el.src = def.src;
            OUTLINE_EL_SETS[k][i].el.onload = () => { OUTLINE_EL_SETS[k][i].loaded = true; };
            // Insert outlined/ before the filename: images/01-LOGOS/logo-1.svg → images/01-LOGOS/outlined/logo-1.svg
            OUTLINE_EL_SETS[k][i].el.src = def.src.replace(/([^/]+\.svg)$/, 'outlined/$1');
        });
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
    if (!paused) {
        tt += (ttTgt - tt) / 4;
        if (frame % 30 == 0) ttTgt = frame * 2;
        if (tt % 600 == 0) ran = Math.random() * 10;
    }

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
    _headingClaimedIdx = 0;
    _textClaimedIdx = 0;
    textBlocks.forEach(tb => { tb.bounds = null; });

    // randomise logo cycling
    if (randomLogo && !paused) {
        logoFrameTimer++;
        if (logoFrameTimer >= LOGO_INTERVAL) {
            logoFrameTimer = 0;
            // Refill shuffle queue when empty: all indices except current, in random order
            if (_logoShuffleQueue.length === 0) {
                let pool = [];
                for (let i = 0; i < RAND_LOGOS.length; i++) { if (i !== logoIdx) pool.push(i); }
                for (let i = pool.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    let tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
                }
                _logoShuffleQueue = pool;
            }
            switchLogo(_logoShuffleQueue.pop());
        }
    }

    if (movement === 'xyz') { drawXYZ(); return; } // xyz uses its own Three.js canvas

    // Voronoi: take over the full frame — just animated cell outlines, nothing under them
    if (showVoronoi) {
        background(bgColor);
        drawVoronoiGrid();
        return;
    }

    if      (movement === 'swarm')   drawSwarm();
    else if (movement === 'organic') drawGrow();
    else if (movement === 'expand')  drawExpand();
    else if (movement === 'burst')   drawBurst();
    else {
        background(bgColor);
        if (logoEls[logoIdx].loaded)
            { let r = logoImageRegion(); splitLogoImages(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0, 1); }
    }
}

// ── colour helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex) {
    return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}

// SVG filter-based logo recolouring — avoids pre-rasterising to a canvas so the
// browser rasterises the SVG fresh at whatever scale each cell needs (no upscale blur).
// The filter maps: SVG coverage → logoColor, transparent → bgColor.
let _logoFilterEl = null, _logoFilterKey = '';
function ensureLogoFilter() {
    let key = logoColor + '|' + bgColor;
    if (_logoFilterKey === key) return;
    if (!_logoFilterEl) {
        _logoFilterEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        _logoFilterEl.setAttribute('width', '0');
        _logoFilterEl.setAttribute('height', '0');
        Object.assign(_logoFilterEl.style, { position: 'absolute', overflow: 'hidden', left: '0', top: '0', pointerEvents: 'none' });
        document.body.appendChild(_logoFilterEl);
    }
    // feFlood(logoColor) masked to SVG alpha → logo shape in logoColor
    // feMerge: bgColor underneath, logo shape on top → correct blend at anti-aliased edges
    _logoFilterEl.innerHTML = `<defs>
      <filter id="lcf" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feFlood flood-color="${logoColor}" result="lc"/>
        <feComposite in="lc" in2="SourceAlpha" operator="in" result="logo"/>
        <feFlood flood-color="${bgColor}" result="bc"/>
        <feMerge><feMergeNode in="bc"/><feMergeNode in="logo"/></feMerge>
      </filter>
    </defs>`;
    _logoFilterKey = key;
}

let _logoCache = null, _logoCacheKey = '';
function getLogoCanvas() {
    let uploadKey = _uploadedLogoOrigEl ? 'u' : 'n';
    // Physical canvas dimensions — the SVG must be rasterized at this resolution
    // so drawImage renders it 1:1 in physical pixels with no upscale blur.
    let phW = drawingContext.canvas.width;
    let pd  = phW / canvas.width; // pixel density (physical px per CSS px)
    // drawRegion draws the logo at these CSS dimensions (same formula it uses):
    //   width:  Math.round(LOGO.w * scaleX) = canvas.width  (always exact integer)
    //   height: Math.round(LOGO.h * scaleY) = Math.round(canvas.height * LOGO.h / LOGO.contentH)
    // Physical destination = CSS * pd. Cache must be exactly that size or the
    // browser will scale it by 1px and introduce blur.
    let dw_css = canvas.width;
    let dh_css = Math.round(canvas.height * LOGO.h / LOGO.contentH);
    let tw = Math.round(dw_css * pd); // = phW
    let th = Math.max(1, Math.round(dh_css * pd));
    let key = `${logoIdx}_${activeLogoSetKey}_${uploadKey}_${logoColor}_${bgColor}_${tw}_${th}`;
    if (_logoCacheKey === key && _logoCache) return _logoCache;
    if (!logoEls[logoIdx] || !logoEls[logoIdx].loaded) return null;
    let el = logoEls[logoIdx].el;
    let tc = document.createElement('canvas');
    tc.width = tw; tc.height = th;
    let tctx = tc.getContext('2d');
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    tctx.fillStyle = '#ffffff';
    tctx.fillRect(0, 0, tw, th);
    tctx.drawImage(el, 0, 0, tw, th);
    let bg = hexToRgb(bgColor), lg = hexToRgb(logoColor);
    let px = tctx.getImageData(0, 0, tw, th);
    for (let i = 0; i < px.data.length; i += 4) {
        // t=0 → fully logo (dark), t=1 → fully background (light)
        // Linear interpolation preserves SVG anti-aliasing at edges
        let t = (px.data[i] + px.data[i+1] + px.data[i+2]) / (3 * 255);
        px.data[i]   = Math.round(lg.r + (bg.r - lg.r) * t);
        px.data[i+1] = Math.round(lg.g + (bg.g - lg.g) * t);
        px.data[i+2] = Math.round(lg.b + (bg.b - lg.b) * t);
        px.data[i+3] = 255;
    }
    tctx.putImageData(px, 0, 0);
    _logoCache = tc; _logoCacheKey = key;
    return tc;
}

// Returns the image-space region (ix, iy, iw, ih) for the root-level split calls,
// adjusted so the logo is centered at `logoScale` fraction of the canvas.
// The grid covers the full canvas; cells outside the logo area show bgColor naturally.
function logoImageRegion() {
    let iw = LOGO.w / logoScale;
    let ih = LOGO.contentH / logoScale;
    let ix = -(iw - LOGO.w) / 2;
    let iy = -(ih - LOGO.contentH) / 2;
    return { ix, iy, iw, ih };
}

// Returns true if the cell centre falls within the canvas region that the logo occupies.
// Derived from logoImageRegion(): logo content (0..LOGO.w, 0..LOGO.contentH) maps to
// ((1-logoScale)/2 .. (1+logoScale)/2) of canvas dimensions.
function inLogoBounds(x, y, w, h) {
    let lx = (1 - logoScale) / 2 * canvas.width;
    let rx = (1 + logoScale) / 2 * canvas.width;
    let ty = (1 - logoScale) / 2 * canvas.height;
    let by = (1 + logoScale) / 2 * canvas.height;
    let cx = x + w * 0.5, cy = y + h * 0.5;
    return cx >= lx && cx <= rx && cy >= ty && cy <= by;
}

// ── x/y drawing ───────────────────────────────────────────────────────────────

function drawRegion(x, y, w, h, ix, iy, iw, ih) {
    if (w < 0.5 || h < 0.5 || iw < 0.01 || ih < 0.01) return;
    if (!logoEls[logoIdx] || !logoEls[logoIdx].loaded) return;
    // Snap to integers so adjacent cell clips share an exact pixel boundary with no anti-aliased seam
    let rx = Math.round(x), ry = Math.round(y);
    let rw = Math.round(x + w) - rx, rh = Math.round(y + h) - ry;
    if (rw < 1 || rh < 1) return;
    let scaleX = w / iw, scaleY = h / ih;
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
    if (_uploadedLogoOrigEl && _uploadedIsRaster) {
        // PNG/JPG upload: draw as-is, no colour transformation
        ctx.drawImage(logoEls[logoIdx].el, Math.round(x - ix * scaleX), Math.round(y - iy * scaleY),
                      Math.round(LOGO.w * scaleX), Math.round(LOGO.h * scaleY));
    } else {
        // SVG (built-in or uploaded): draw directly so the browser rasterises at the exact destination
        // scale — no upscale blur. The CSS filter maps SVG alpha → logoColor / bgColor.
        ensureLogoFilter();
        ctx.filter = 'url(#lcf)';
        ctx.drawImage(logoEls[logoIdx].el,
                      x - ix * scaleX, y - iy * scaleY,
                      LOGO.w * scaleX, LOGO.h * scaleY);
    }
    ctx.restore();
}

// ── Voronoi grid overlay ──────────────────────────────────────────────────────

// Walk the same recursive split as splitLogoImages and collect each leaf cell's
// centre as a Voronoi seed, along with its logo region and cell bounds so the
// content can be drawn correctly inside each polygon.
function collectVoronoiSeeds(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        return [{ x: x + w/2, y: y + h/2, cx: x, cy: y, cw: w, ch: h, ix, iy, iw, ih, nodeId }];
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
        return [
            ...collectVoronoiSeeds(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0),
            ...collectVoronoiSeeds(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1),
            ...collectVoronoiSeeds(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2),
            ...collectVoronoiSeeds(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3),
        ];
    } else if (nodeId % 2 == 0) {
        return [
            ...collectVoronoiSeeds(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0),
            ...collectVoronoiSeeds(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1),
        ];
    } else {
        return [
            ...collectVoronoiSeeds(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0),
            ...collectVoronoiSeeds(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1),
        ];
    }
}

function _clipPolyHalfPlane(poly, dx, dy, c) {
    let out = [];
    for (let i = 0; i < poly.length; i++) {
        let a = poly[i], b = poly[(i + 1) % poly.length];
        let va = dx * a.x + dy * a.y, vb = dx * b.x + dy * b.y;
        if (va <= c) out.push(a);
        if ((va <= c) !== (vb <= c)) {
            let t = (c - va) / (vb - va);
            out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
        }
    }
    return out;
}

function drawVoronoiGrid() {
    if (!logoEls[logoIdx] || !logoEls[logoIdx].loaded) return;
    let W = canvas.width, H = canvas.height;
    let r = logoImageRegion();
    let seeds = collectVoronoiSeeds(0, 0, W, H, r.ix, r.iy, r.iw, r.ih, 0, 1);

    // Pre-compute all Voronoi polygons
    let cells = seeds.map((s, i) => {
        let poly = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
        for (let j = 0; j < seeds.length; j++) {
            if (i === j || poly.length === 0) continue;
            let dx = seeds[j].x - s.x, dy = seeds[j].y - s.y;
            let c  = (seeds[j].x*seeds[j].x - s.x*s.x + seeds[j].y*seeds[j].y - s.y*s.y) / 2;
            poly = _clipPolyHalfPlane(poly, dx, dy, c);
        }
        return poly;
    });

    let ctx = drawingContext;

    // Pass 1: fill each polygon with logo content clipped to the polygon shape
    for (let i = 0; i < seeds.length; i++) {
        let poly = cells[i];
        if (poly.length < 3) continue;
        let s = seeds[i];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k].x, poly[k].y);
        ctx.closePath();
        ctx.clip();

        // bgColor base (handles transparent logo areas)
        ctx.fillStyle = bgColor;
        ctx.fill();

        // Content — same priority as drawLeafCell
        randomSeed(s.nodeId * 17 + 3331);
        let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
        if (showImages && pool.length > 0 && random() < 0.35 && s.cw > 80 && s.ch > 50) {
            let img = pool[floor(random() * pool.length)];
            let ir = img.naturalWidth / img.naturalHeight, cr = s.cw / s.ch;
            let sx, sy, sw, sh;
            if (ir > cr) { sh = img.naturalHeight; sw = sh * cr; sx = (img.naturalWidth - sw) / 2; sy = 0; }
            else         { sw = img.naturalWidth;  sh = sw / cr; sx = 0; sy = (img.naturalHeight - sh) / 2; }
            ctx.drawImage(img, sx, sy, sw, sh, s.cx, s.cy, s.cw, s.ch);
        } else if (showLogo) {
            let scaleX = s.cw / s.iw, scaleY = s.ch / s.ih;
            let lx = s.cx - s.ix * scaleX, ly = s.cy - s.iy * scaleY;
            let lw = LOGO.w * scaleX,      lh = LOGO.h * scaleY;
            if (_uploadedLogoOrigEl && _uploadedIsRaster) {
                ctx.drawImage(logoEls[logoIdx].el, lx, ly, lw, lh);
            } else {
                ensureLogoFilter();
                ctx.filter = 'url(#lcf)';
                ctx.drawImage(logoEls[logoIdx].el, lx, ly, lw, lh);
                ctx.filter = 'none';
            }
        }

        ctx.restore();
    }

    // Pass 2: draw outlines only when grid lines is on
    if (showGrid) {
        ctx.save();
        ctx.strokeStyle = logoColor;
        ctx.lineWidth = 1.0;
        for (let i = 0; i < cells.length; i++) {
            let poly = cells[i];
            if (poly.length < 3) continue;
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k].x, poly[k].y);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawImageCover(img, x, y, w, h) {
    if (!img || w < 1 || h < 1) return;
    let ir = img.naturalWidth / img.naturalHeight;
    let cr = w / h;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = img.naturalHeight; sw = sh * cr; sx = (img.naturalWidth - sw) / 2; sy = 0; }
    else         { sw = img.naturalWidth;  sh = sw / cr; sx = 0; sy = (img.naturalHeight - sh) / 2; }
    let ctx = drawingContext;
    let rx = Math.round(x), ry = Math.round(y), rw = Math.round(x+w)-rx, rh = Math.round(y+h)-ry;
    ctx.save();
    ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, rx, ry, rw, rh);
    ctx.restore();
}

// Unified leaf-cell renderer used by every mode.
function drawLeafCell(x, y, w, h, ix, iy, iw, ih, nodeId) {
    let rx = Math.round(x), ry = Math.round(y);
    let rw = Math.round(x + w) - rx, rh = Math.round(y + h) - ry;
    let cx = x + w / 2, cy = y + h / 2;

    // ── normal rect rendering ─────────────────────────────────────────────────
    randomSeed(nodeId * 17 + 3331);
    let pool = extraImages.slice(0, imgCount).filter(img => img !== null);
    if (showImages && pool.length > 0 && random() < 0.35 && w > 80 && h > 50) {
        drawImageCover(pool[floor(random() * pool.length)], x, y, w, h);
    } else if (showLinesLogo) {
        // lines & logo: draw logo first, then overlay cell outlines below
        drawRegion(x, y, w, h, ix, iy, iw, ih);
    } else if (showGrid) {
        fill(bgColor); noStroke(); rect(rx, ry, rw, rh);
    } else if (showLogo) {
        drawRegion(x, y, w, h, ix, iy, iw, ih);
    } else {
        fill(bgColor); noStroke(); rect(rx, ry, rw, rh);
    }
    if (showGrid || showLinesLogo) {
        noFill(); stroke(logoColor); strokeWeight(0.5); rect(rx, ry, rw, rh);
    }
    if (showOutline) { noFill(); stroke(logoColor); strokeWeight(0.5); rect(x, y, w, h); }
}

function splitLogoImages(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));
    let { amp, stopP } = LOGO;
    if ((random() < stopP && n > 3) || n > maxDepth) {
        if (_headingClaimedIdx < headingImgs.length && w >= HEADING_MIN_W && h >= HEADING_MIN_H && inLogoBounds(x, y, w, h)) {
            drawHeadingCell(x, y, w, h, headingImgs[_headingClaimedIdx++]); return;
        }
        if (_textClaimedIdx < textBlocks.length) { let _tb = textBlocks[_textClaimedIdx], _ms = TEXT_MIN_SIZES[Math.min(_tb.level, TEXT_MIN_SIZES.length-1)]; if (_tb.text && w >= _ms.w && h >= _ms.h) { _tb.bounds = { x, y, w, h }; _textClaimedIdx++; drawTextBgCell(x, y, w, h); return; } }
        drawLeafCell(x, y, w, h, ix, iy, iw, ih, nodeId);
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

function initSwarmPoints() {
    // Spread 3 starting positions across the canvas so letters are visible immediately
    swarmPoints = [
        { x: canvas.width * 0.25, y: canvas.height * 0.5,  vx: 2.5,  vy: -1.8 },
        { x: canvas.width * 0.5,  y: canvas.height * 0.35, vx: -2.0, vy:  2.2 },
        { x: canvas.width * 0.75, y: canvas.height * 0.6,  vx: 1.5,  vy: -2.5 },
    ];
}

function updateSwarm() {
    if (swarmPoints.length === 0) initSwarmPoints();
    const minSpd = 3.0, maxSpd = 7.0;
    for (let p of swarmPoints) {
        p.vx += (Math.random() - 0.5) * 0.7;
        p.vy += (Math.random() - 0.5) * 0.7;
        p.vx *= 0.95; p.vy *= 0.95;
        let spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > maxSpd) { p.vx *= maxSpd / spd; p.vy *= maxSpd / spd; }
        if (spd < minSpd) { p.vx *= minSpd / spd; p.vy *= minSpd / spd; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0)            { p.x = 0;            p.vx =  Math.abs(p.vx); }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx); }
        if (p.y < 0)            { p.y = 0;            p.vy =  Math.abs(p.vy); }
        if (p.y > canvas.height){ p.y = canvas.height;p.vy = -Math.abs(p.vy); }
    }
}

function drawSwarm() {
    if (!paused) { swarmTT += 1.8; updateSwarm(); }
    background(bgColor);
    if (!logoEls[logoIdx].loaded) return;
    { let r = logoImageRegion(); splitLogoMouse(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0, 1); }
}

function splitLogoMouse(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    // Slowly animated splits driven by swarmTT (not the global tt)
    let { amp } = LOGO;
    let crx = 0.5 + amp * Math.sin(swarmTT * 0.012 + nodeId * 0.7);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(swarmTT * 0.012 + nodeId * 1.3);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);

    // Closest point on this cell to each swarm circle — take the strongest influence
    const sigma = 300, sig2 = sigma * sigma;
    let influence = 0;
    for (let p of swarmPoints) {
        let nearX = Math.max(x, Math.min(p.x, x + w));
        let nearY = Math.max(y, Math.min(p.y, y + h));
        let d2 = (nearX - p.x) ** 2 + (nearY - p.y) ** 2;
        influence = Math.max(influence, Math.exp(-d2 / sig2));
    }
    let localDepth = Math.max(1, Math.round(influence * maxDepth));

    if (n >= localDepth) {
        if (_headingClaimedIdx < headingImgs.length && w >= HEADING_MIN_W && h >= HEADING_MIN_H && inLogoBounds(x, y, w, h)) {
            drawHeadingCell(x, y, w, h, headingImgs[_headingClaimedIdx++]); return;
        }
        if (_textClaimedIdx < textBlocks.length) { let _tb = textBlocks[_textClaimedIdx], _ms = TEXT_MIN_SIZES[Math.min(_tb.level, TEXT_MIN_SIZES.length-1)]; if (_tb.text && w >= _ms.w && h >= _ms.h) { _tb.bounds = { x, y, w, h }; _textClaimedIdx++; drawTextBgCell(x, y, w, h); return; } }
        drawLeafCell(x, y, w, h, ix, iy, iw, ih, nodeId);
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
    background(bgColor);
    if (!logoEls[logoIdx].loaded) return;
    { let r = logoImageRegion(); splitLogoGrow(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0, 1); }
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
    if (_headingClaimedIdx < headingImgs.length && w >= HEADING_MIN_W && h >= HEADING_MIN_H && inLogoBounds(x, y, w, h)) {
        mitosisMap.delete(nodeId); drawHeadingCell(x, y, w, h, headingImgs[_headingClaimedIdx++]); return;
    }
    if (_textClaimedIdx < textBlocks.length) { let _tb = textBlocks[_textClaimedIdx], _ms = TEXT_MIN_SIZES[Math.min(_tb.level, TEXT_MIN_SIZES.length-1)]; if (_tb.text && w >= _ms.w && h >= _ms.h) { _tb.bounds = { x, y, w, h }; _textClaimedIdx++; mitosisMap.delete(nodeId); drawTextBgCell(x, y, w, h); return; } }

    // Normal render this frame
    drawLeafCell(x, y, w, h, ix, iy, iw, ih, nodeId);
    if (w > MITOSIS_THRESHOLD && h > MITOSIS_THRESHOLD) {
        mitosisMap.set(nodeId, {
            scale: 1.0,
            rate:  0.003 + Math.random() * 0.003,
            children: null,
            splitDir: w >= h ? 'h' : 'v'
        });
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

// ── expand mode ───────────────────────────────────────────────────────────────

// Build one expander with EXPAND_ROOT_COUNT arms. Pre-simulate `startFrames` so
// expanders initialised at different phases are already mid-growth.
function makeExpander(startFrames) {
    let diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    let cx = canvas.width  * (0.15 + Math.random() * 0.70);
    let cy = canvas.height * (0.15 + Math.random() * 0.70);
    let arms = [];
    for (let i = 0; i < EXPAND_ROOT_COUNT; i++) {
        // Spread base angles evenly with a small random offset
        let angle  = (i / EXPAND_ROOT_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        let dAngle = (Math.random() - 0.5) * 2 * EXPAND_ROOT_CURVE;
        let speed  = EXPAND_ROOT_SPEED * (0.7 + Math.random() * 0.6);
        let ax = cx, ay = cy, r = 0;
        let trail = [];
        // Pre-simulate to stagger phases
        for (let f = 0; f < startFrames; f++) {
            angle += dAngle;
            ax += speed * Math.cos(angle);
            ay += speed * Math.sin(angle);
            r  += speed;
            trail.push({ x: ax, y: ay });
            if (trail.length > EXPAND_ROOT_TRAIL) trail.shift();
        }
        arms.push({ angle, dAngle, x: ax, y: ay, r, trail, speed, done: r >= diag });
    }
    return { cx, cy, arms, maxR: diag };
}

function initExpanders() {
    expanders = [];
    const COUNT = 6;
    let diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    let maxFrames = Math.round(diag / EXPAND_ROOT_SPEED);
    for (let i = 0; i < COUNT; i++) {
        expanders.push(makeExpander(Math.round(maxFrames * i / COUNT)));
    }
}

function updateExpanders() {
    let diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
    for (let i = expanders.length - 1; i >= 0; i--) {
        let e = expanders[i];
        let allDone = true;
        for (let arm of e.arms) {
            if (arm.done) continue;
            arm.angle += arm.dAngle;
            arm.x += arm.speed * Math.cos(arm.angle);
            arm.y += arm.speed * Math.sin(arm.angle);
            arm.r += arm.speed;
            arm.trail.push({ x: arm.x, y: arm.y });
            if (arm.trail.length > EXPAND_ROOT_TRAIL) arm.trail.shift();
            if (arm.r >= e.maxR) arm.done = true;
            else allDone = false;
        }
        if (allDone) {
            expanders.splice(i, 1);
            expanders.push(makeExpander(0));
        }
    }
}

// Influence = proximity to any arm's trail, weighted by recency (tip = brightest).
function expanderInfluence(x, y, w, h) {
    let maxInf = 0;
    let sig2 = EXPAND_ROOT_SIGMA * EXPAND_ROOT_SIGMA;
    let px = x + w * 0.5, py = y + h * 0.5;
    for (let e of expanders) {
        for (let arm of e.arms) {
            let n = arm.trail.length;
            for (let t = 0; t < n; t++) {
                let weight = Math.sqrt((t + 1) / n); // older = dimmer
                let pos = arm.trail[t];
                let d2 = (px - pos.x) ** 2 + (py - pos.y) ** 2;
                let inf = weight * Math.exp(-d2 / sig2);
                if (inf > maxInf) maxInf = inf;
            }
        }
    }
    return maxInf;
}

function drawExpand() {
    if (!paused) expandTT += 0.5;
    if (expanders.length === 0) initExpanders();
    if (!paused) updateExpanders();
    background(bgColor);
    if (!logoEls[logoIdx].loaded) return;
    { let r = logoImageRegion(); splitLogoExpand(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0, 1); }
}

function splitLogoExpand(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    let { amp } = LOGO;
    let crx = 0.5 + amp * Math.sin(expandTT * (0.003 + n * 0.003) + n * 50);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(expandTT * (0.003 + n * 0.003) + n * 9930);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);

    if (n >= maxDepth) {
        renderLeafExpand(x, y, w, h, ix, iy, iw, ih, nodeId);
        return;
    }

    let ww = w * crx, ww2 = w * (1 - crx);
    let hh = h * cry, hh2 = h * (1 - cry);
    let iww = iw * 0.5, iww2 = iw * 0.5;
    let ihh = ih * 0.5, ihh2 = ih * 0.5;
    if (n <= 1) {
        splitLogoExpand(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1, nodeId*4+0);
        splitLogoExpand(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1, nodeId*4+1);
        splitLogoExpand(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1, nodeId*4+2);
        splitLogoExpand(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1, nodeId*4+3);
    } else if (nodeId % 2 == 0) {
        splitLogoExpand(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
        splitLogoExpand(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
    } else {
        splitLogoExpand(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
        splitLogoExpand(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
    }
}

function renderLeafExpand(x, y, w, h, ix, iy, iw, ih, nodeId) {
    // Content cells always visible
    if (_headingClaimedIdx < headingImgs.length && w >= HEADING_MIN_W && h >= HEADING_MIN_H && inLogoBounds(x, y, w, h)) {
        drawHeadingCell(x, y, w, h, headingImgs[_headingClaimedIdx++]); return;
    }
    if (_textClaimedIdx < textBlocks.length) { let _tb = textBlocks[_textClaimedIdx], _ms = TEXT_MIN_SIZES[Math.min(_tb.level, TEXT_MIN_SIZES.length-1)]; if (_tb.text && w >= _ms.w && h >= _ms.h) { _tb.bounds = { x, y, w, h }; _textClaimedIdx++; drawTextBgCell(x, y, w, h); return; } }

    let inf = expanderInfluence(x, y, w, h);

    if (inf < 0.05) {
        if (!logoOnly) { fill(bgColor); noStroke(); rect(Math.round(x), Math.round(y), Math.round(x+w)-Math.round(x), Math.round(y+h)-Math.round(y)); }
        return;
    }
    if (inf < 0.30) {
        if (!logoOnly) { fill(bgColor); stroke(logoColor); strokeWeight(0.5); rect(Math.round(x), Math.round(y), Math.round(x+w)-Math.round(x), Math.round(y+h)-Math.round(y)); }
        return;
    }

    // Fully inside the ring — reveal content
    drawLeafCell(x, y, w, h, ix, iy, iw, ih, nodeId);
}

// ── burst mode — wandering droplet particle system ────────────────────────────

// Pre-render the full logo to an offscreen canvas with TRANSPARENT background —
// only logo-coloured pixels are opaque, so droplets show just the logo shape.
function ensureBurstCanvas() {
    let pd  = drawingContext.canvas.width / canvas.width;
    let key = `${logoIdx}_${activeLogoSetKey}_${logoColor}_${canvas.width}_${canvas.height}_${logoScale.toFixed(3)}`;
    if (burstCanvasKey === key && burstCanvas) return burstCanvas;
    if (!logoEls[logoIdx] || !logoEls[logoIdx].loaded) return null;
    let pw = Math.round(canvas.width * pd), ph = Math.round(canvas.height * pd);
    let bc = document.createElement('canvas');
    bc.width = pw; bc.height = ph;
    let bctx = bc.getContext('2d');
    // White fill so transparent SVG areas → white; logo shapes → dark
    bctx.fillStyle = '#ffffff';
    bctx.fillRect(0, 0, pw, ph);
    let r = logoImageRegion();
    let sx = canvas.width / r.iw * pd, sy = canvas.height / r.ih * pd;
    bctx.drawImage(logoEls[logoIdx].el, -r.ix * sx, -r.iy * sy, LOGO.w * sx, LOGO.h * sy);
    let lg = hexToRgb(logoColor);
    let px = bctx.getImageData(0, 0, pw, ph);
    for (let i = 0; i < px.data.length; i += 4) {
        // lum: 0 = pure dark (logo), 1 = white (background / letter holes)
        let lum = (px.data[i] + px.data[i+1] + px.data[i+2]) / (3 * 255);
        let a = Math.max(0, 1 - lum / 0.45) * 255;  // dark pixels → opaque; white → transparent
        if (a < 12) {
            px.data[i] = px.data[i+1] = px.data[i+2] = px.data[i+3] = 0;
        } else {
            px.data[i]   = lg.r;
            px.data[i+1] = lg.g;
            px.data[i+2] = lg.b;
            px.data[i+3] = Math.min(255, Math.round(a));
        }
    }
    bctx.putImageData(px, 0, 0);
    burstCanvas = bc; burstCanvasKey = key;
    return bc;
}

// Deterministic leaf-cell collector (mirrors splitLogoImages recursion at t=0).
function collectBurstSeeds(x, y, w, h, ix, iy, iw, ih, n) {
    let { amp } = LOGO;
    let crx = 0.5 + amp * Math.sin(n * 50.0);
    crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
    let cry = 0.5 + amp * Math.cos(n * 9930.0);
    cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);
    if (n >= maxDepth) return [{ x, y, w, h, ix, iy, iw, ih }];
    let ww = w * crx, ww2 = w - ww, hh = h * cry, hh2 = h - hh;
    let iww = iw * 0.5, iww2 = iw - iww, ihh = ih * 0.5, ihh2 = ih - ihh;
    let out = [];
    if (n <= 1) {
        out.push(...collectBurstSeeds(x,    y,    ww,  hh,  ix,     iy,     iww,  ihh,  n+1));
        out.push(...collectBurstSeeds(x+ww, y,    ww2, hh,  ix+iww, iy,     iww2, ihh,  n+1));
        out.push(...collectBurstSeeds(x,    y+hh, ww,  hh2, ix,     iy+ihh, iww,  ihh2, n+1));
        out.push(...collectBurstSeeds(x+ww, y+hh, ww2, hh2, ix+iww, iy+ihh, iww2, ihh2, n+1));
    } else if (n % 2 === 0) {
        out.push(...collectBurstSeeds(x,    y, ww,  h, ix,     iy, iww,  ih, n+1));
        out.push(...collectBurstSeeds(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1));
    } else {
        out.push(...collectBurstSeeds(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1));
        out.push(...collectBurstSeeds(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1));
    }
    return out;
}

// Build seed list filtered to logo-coloured cells only (so only blue pieces fly).
function refreshBurstSeeds() {
    let bc = burstCanvas; if (!bc) return;
    let pd = bc.width / canvas.width;
    let bctx = bc.getContext('2d');
    let bg = hexToRgb(bgColor);
    let r = logoImageRegion();
    let all = collectBurstSeeds(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0);
    burstSeedCache = all.filter(s => {
        let cx = Math.floor((s.x + s.w * 0.5) * pd);
        let cy = Math.floor((s.y + s.h * 0.5) * pd);
        let p = bctx.getImageData(cx, cy, 1, 1).data;
        return Math.abs(p[0]-bg.r) + Math.abs(p[1]-bg.g) + Math.abs(p[2]-bg.b) > 45;
    });
}

// Place 6 attractor points randomly on the canvas edges, each with a slow drift velocity.
function initBurstAttractors() {
    burstAttractors = [];
    let W = canvas.width, H = canvas.height;
    for (let i = 0; i < 6; i++) {
        let edge = Math.floor(Math.random() * 4);
        let x, y;
        if      (edge === 0) { x = 15 + Math.random() * (W - 30); y = 0; }
        else if (edge === 1) { x = W;  y = 15 + Math.random() * (H - 30); }
        else if (edge === 2) { x = 15 + Math.random() * (W - 30); y = H; }
        else                 { x = 0;  y = 15 + Math.random() * (H - 30); }
        burstAttractors.push({ x, y, vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4 });
    }
}

// Slowly drift each attractor along the canvas edges. Clusters migrate with them.
function updateBurstAttractors() {
    let W = canvas.width, H = canvas.height, margin = 55;
    for (let a of burstAttractors) {
        a.vx += (Math.random() - 0.5) * 0.12;
        a.vy += (Math.random() - 0.5) * 0.12;
        // Spring pull toward nearest edge so they stay near the perimeter
        let dL = a.x, dR = W - a.x, dT = a.y, dB = H - a.y;
        let nearest = Math.min(dL, dR, dT, dB);
        if (nearest > margin) {
            if      (dL === nearest) a.vx -= 0.08;
            else if (dR === nearest) a.vx += 0.08;
            else if (dT === nearest) a.vy -= 0.08;
            else                     a.vy += 0.08;
        }
        a.vx *= 0.95; a.vy *= 0.95;  // damping
        a.x = Math.max(5, Math.min(W - 5, a.x + a.vx));
        a.y = Math.max(5, Math.min(H - 5, a.y + a.vy));
    }
}

function spawnBurstDroplet() {
    if (!burstSeedCache.length || !burstAttractors.length) return;
    let s = burstSeedCache[Math.floor(Math.random() * burstSeedCache.length)];
    let ccx = canvas.width / 2, ccy = canvas.height / 2;
    let dx = (s.x + s.w * 0.5) - ccx, dy = (s.y + s.h * 0.5) - ccy;
    // Assign nearest attractor so droplets flow naturally outward to closest edge point
    let attrIdx = 0, bestD = Infinity;
    for (let j = 0; j < burstAttractors.length; j++) {
        let ax = burstAttractors[j].x - s.x, ay = burstAttractors[j].y - s.y;
        let d2 = ax*ax + ay*ay;
        if (d2 < bestD) { bestD = d2; attrIdx = j; }
    }
    let dw = s.w * BURST_SIZE_SCALE, dh = s.h * BURST_SIZE_SCALE;
    // Cap the longest side, scale the other proportionally so shape is preserved
    let capScale = Math.min(1, BURST_MAX_DROP_SIZE / Math.max(dw, dh));
    dw *= capScale; dh *= capScale;
    burstDroplets.push({
        x: s.x - (dw - s.w) * 0.5, y: s.y - (dh - s.h) * 0.5,  // centre on seed cell
        w: dw, h: dh,
        srcX: s.x, srcY: s.y, srcW: s.w, srcH: s.h,
        angle: Math.atan2(dy, dx),
        speed: BURST_MIN_SPEED + Math.random() * (BURST_MAX_SPEED - BURST_MIN_SPEED),
        attractorIdx: attrIdx,
        splitCooldown: 40 + Math.floor(Math.random() * 60),
        settled: false,
        phase: Math.random() * Math.PI * 2,   // unique wiggle phase per droplet
        settledX: 0, settledY: 0,             // locked position when settled
    });
}

function updateBurstDroplets() {
    let toAdd = [];
    for (let i = burstDroplets.length - 1; i >= 0; i--) {
        let d = burstDroplets[i];
        if (d.settled) {
            // Expire after a while to free up slots for new droplets
            d.settledAge = (d.settledAge || 0) + 1;
            if (d.settledAge > 420) { burstDroplets.splice(i, 1); continue; }
            // Track attractor as it drifts — whole cluster migrates together
            let a = burstAttractors[d.attractorIdx];
            d.settledX = Math.max(d.w, Math.min(canvas.width  - d.w, a.x + d.offsetX));
            d.settledY = Math.max(d.h, Math.min(canvas.height - d.h, a.y + d.offsetY));
            // Spring random-walk buzz around the (moving) anchor
            d.vx = (d.vx || 0) + (Math.random() - 0.5) * 1.4;
            d.vy = (d.vy || 0) + (Math.random() - 0.5) * 1.4;
            d.vx += (d.settledX - d.x) * 0.06;
            d.vy += (d.settledY - d.y) * 0.06;
            d.vx *= 0.78; d.vy *= 0.78;
            let spd = Math.sqrt(d.vx*d.vx + d.vy*d.vy);
            if (spd > BURST_WIGGLE_AMP) { d.vx *= BURST_WIGGLE_AMP/spd; d.vy *= BURST_WIGGLE_AMP/spd; }
            d.x += d.vx; d.y += d.vy;
            continue;
        }
        let attr = burstAttractors[d.attractorIdx];
        let cx = d.x + d.w * 0.5, cy = d.y + d.h * 0.5;
        let dx = attr.x - cx, dy = attr.y - cy;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 18) {
            d.settled = true;
            // Scatter offset stored relative to attractor so cluster migrates with it
            let scatter = 22 + Math.random() * 72;
            let sAngle  = Math.random() * Math.PI * 2;
            d.offsetX = Math.cos(sAngle) * scatter;
            d.offsetY = Math.sin(sAngle) * scatter;
            d.settledX = Math.max(d.w, Math.min(canvas.width  - d.w, attr.x + d.offsetX));
            d.settledY = Math.max(d.h, Math.min(canvas.height - d.h, attr.y + d.offsetY));
            continue;
        }
        // Wobble, then gently steer toward attractor
        d.angle += (Math.random() - 0.5) * 2 * BURST_WOBBLE;
        let targetAngle = Math.atan2(dy, dx);
        let da = targetAngle - d.angle;
        while (da >  Math.PI) da -= 2 * Math.PI;
        while (da < -Math.PI) da += 2 * Math.PI;
        d.angle += da * 0.06;
        // Irregular speed — sometimes dart, sometimes crawl
        d.speed += (Math.random() - 0.5) * 0.7;
        d.speed  = Math.max(BURST_MIN_SPEED, Math.min(BURST_MAX_SPEED, d.speed));
        d.x += Math.cos(d.angle) * d.speed;
        d.y += Math.sin(d.angle) * d.speed;
        // Split: parent shrinks, child heads to a different attractor
        d.splitCooldown--;
        if (d.splitCooldown <= 0 && Math.random() < BURST_SPLIT_P
                && burstDroplets.length + toAdd.length < BURST_MAX_DROPLETS) {
            let spread = 0.2 + Math.random() * 0.2;
            let nw = d.w * 0.72, nh = d.h * 0.72;
            let childAttr = (d.attractorIdx + 1 + Math.floor(Math.random() * (burstAttractors.length - 1))) % burstAttractors.length;
            toAdd.push({
                x: d.x, y: d.y, w: nw, h: nh,
                srcX: d.srcX, srcY: d.srcY, srcW: d.srcW, srcH: d.srcH,
                angle: d.angle + spread,
                speed: BURST_MIN_SPEED + Math.random() * (BURST_MAX_SPEED - BURST_MIN_SPEED),
                attractorIdx: childAttr,
                splitCooldown: 70 + Math.floor(Math.random() * 70),
                settled: false,
                phase: Math.random() * Math.PI * 2,
                settledX: 0, settledY: 0,
            });
            d.w = nw; d.h = nh;
            d.angle -= spread;
            d.speed  = BURST_MIN_SPEED + Math.random() * (BURST_MAX_SPEED - BURST_MIN_SPEED);
            d.splitCooldown = 70 + Math.floor(Math.random() * 70);
        }
    }
    for (let d of toAdd) burstDroplets.push(d);
}

// Always draw at full opacity — transparency comes only from the burst canvas alpha channel.
function drawBurstDroplets() {
    let bc = burstCanvas; if (!bc) return;
    let pd = bc.width / canvas.width;
    let ctx = drawingContext;
    for (let d of burstDroplets) {
        ctx.drawImage(bc,
            Math.round(d.srcX * pd), Math.round(d.srcY * pd),
            Math.round(d.srcW * pd), Math.round(d.srcH * pd),
            d.x, d.y, d.w, d.h);
    }
}

function drawBurst() {
    if (!logoEls[logoIdx].loaded) return;
    let bc = ensureBurstCanvas(); if (!bc) return;
    if (!paused) {
        burstTT++;
        if (!burstSeedCache.length) refreshBurstSeeds();
        burstSpawnTimer++;
        if (burstSpawnTimer >= BURST_SPAWN_INTERVAL && burstDroplets.length < BURST_MAX_DROPLETS) {
            for (let i = 0; i < BURST_SPAWN_COUNT; i++) spawnBurstDroplet();
            burstSpawnTimer = 0;
        }
        updateBurstAttractors();
        updateBurstDroplets();
    }
    background(bgColor);
    { let r = logoImageRegion(); splitLogoImages(0, 0, canvas.width, canvas.height, r.ix, r.iy, r.iw, r.ih, 0, 1); }
    drawBurstDroplets();
}

// ── x/y/z Three.js depth mode ─────────────────────────────────────────────────

function setupXYZ() {
    if (xyzReady) return;
    if (!logoEls[logoIdx].loaded) return;

    // Logo texture: draw SVG to offscreen canvas at high res, threshold to bgColor/logoColor
    let texW = 2048, texH = Math.max(1, Math.round(2048 * LOGO.h / LOGO.w));
    let oc = document.createElement('canvas');
    oc.width = texW; oc.height = texH;
    let octx = oc.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, texW, texH);
    octx.drawImage(logoEls[logoIdx].el, 0, 0, texW, texH);
    { let _bg = hexToRgb(bgColor), _lg = hexToRgb(logoColor);
      let px = octx.getImageData(0, 0, texW, texH);
      for (let i = 0; i < px.data.length; i += 4) {
          let dark = (px.data[i] + px.data[i+1] + px.data[i+2]) / 3 < 128;
          px.data[i] = dark ? _lg.r : _bg.r; px.data[i+1] = dark ? _lg.g : _bg.g;
          px.data[i+2] = dark ? _lg.b : _bg.b; px.data[i+3] = 255;
      }
      octx.putImageData(px, 0, 0);
    }

    let logoTex = new THREE.CanvasTexture(oc);
    logoTex.magFilter = THREE.NearestFilter;
    logoTex.minFilter = THREE.NearestFilter;
    xyzLogoMat  = new THREE.MeshBasicMaterial({ map: logoTex });

    // Only create the canvas, renderer, scene, camera, and mesh pool once
    if (!xyzEl) {
        xyzGridMat  = new THREE.MeshBasicMaterial({ color: bgColor, wireframe: false });
        xyzBlankMat = new THREE.MeshBasicMaterial({ color: bgColor });

        for (let i = 0; i < extraImages.length; i++) {
            xyzImgMats[i] = null;
        }

        xyzEl = document.createElement('canvas');
        css(xyzEl, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', display: 'none', pointerEvents: 'none', zIndex: '5' });
        document.body.appendChild(xyzEl);

        xyzRenderer = new THREE.WebGLRenderer({ canvas: xyzEl, antialias: true });
        xyzRenderer.setSize(window.innerWidth, window.innerHeight);
        xyzRenderer.setPixelRatio(window.devicePixelRatio || 1);

        xyzScene = new THREE.Scene();
        xyzScene.background = new THREE.Color(bgColor);

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
    swarmPoints = [];
    if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
}

function switchLogoSet(key) {
    clearUploadedLogo();
    activeLogoSetKey = key;
    RAND_LOGOS = LOGO_SETS[key];
    logoEls    = LOGO_EL_SETS[key];
    outlineEls = OUTLINE_EL_SETS[key];
    logoIdx    = Math.min(logoIdx, Math.max(0, RAND_LOGOS.length - 1));
    LOGO       = RAND_LOGOS[logoIdx] || RAND_LOGOS[0];
    swarmPoints = [];
    _logoShuffleQueue = [];
    if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
    else xyzReady = false;
}

// ── custom uploaded logo (overrides active set) ───────────────────────────────
let _uploadedLogoOrigEl    = null;
let _uploadedOutlineOrigEl = null;
let _uploadedIsRaster      = false; // true for PNG/JPG uploads — drawn as-is, no colour mapping

function applyUploadedLogo(img) {
    _uploadedLogoOrigEl    = logoEls[logoIdx];
    _uploadedOutlineOrigEl = outlineEls[logoIdx];
    logoEls[logoIdx]    = { el: img, loaded: true };
    outlineEls[logoIdx] = { el: img, loaded: false };
    let w = img.naturalWidth  || LOGO.w;
    let h = img.naturalHeight || LOGO.h;
    LOGO = { ...LOGO, w, h, contentH: h };
    swarmPoints = [];
    if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
    else xyzReady = false;
}

function clearUploadedLogo() {
    if (!_uploadedLogoOrigEl) return;
    logoEls[logoIdx]    = _uploadedLogoOrigEl;
    outlineEls[logoIdx] = _uploadedOutlineOrigEl;
    _uploadedLogoOrigEl    = null;
    _uploadedOutlineOrigEl = null;
    _uploadedIsRaster      = false;
    LOGO = RAND_LOGOS[logoIdx] || RAND_LOGOS[0];
    swarmPoints = [];
    if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
    else xyzReady = false;
}

function rebuildXYZLogoTex() {
    let texW = 2048, texH = Math.max(1, Math.round(2048 * LOGO.h / LOGO.w));
    let oc = document.createElement('canvas');
    oc.width = texW; oc.height = texH;
    let octx = oc.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, texW, texH);
    octx.drawImage(logoEls[logoIdx].el, 0, 0, texW, texH);
    let _bg = hexToRgb(bgColor), _lg = hexToRgb(logoColor);
    let px = octx.getImageData(0, 0, texW, texH);
    for (let i = 0; i < px.data.length; i += 4) {
        let dark = (px.data[i] + px.data[i+1] + px.data[i+2]) / 3 < 128;
        px.data[i] = dark ? _lg.r : _bg.r; px.data[i+1] = dark ? _lg.g : _bg.g;
        px.data[i+2] = dark ? _lg.b : _bg.b; px.data[i+3] = 255;
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

function drawHeadingCell(x, y, w, h, img) {
    let ctx = drawingContext;
    let rx = Math.round(x), ry = Math.round(y), rw = Math.round(x+w)-rx, rh = Math.round(y+h)-ry;
    if (img && img.complete && img.naturalWidth > 0) {
        let iw = img.naturalWidth || 300, ih = img.naturalHeight || 150;
        let pad = 12, availW = w - 2 * pad, availH = h - 2 * pad;
        let ir = iw / ih, cr = availW / availH;
        let dw = ir > cr ? availW : availH * ir;
        let dh = ir > cr ? availW / ir : availH;
        let dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
        if (img._isRaster) {
            // PNG/JPG: draw as-is, no colour transformation
            ctx.drawImage(img, dx, dy, dw, dh);
        } else {
            // SVG: render at physical pixel resolution then colorise to logoColor
            let pd = drawingContext.canvas.width / canvas.width;
            let odw = Math.max(1, Math.round(dw * pd)), odh = Math.max(1, Math.round(dh * pd));
            let oc = document.createElement('canvas');
            oc.width = odw; oc.height = odh;
            let octx = oc.getContext('2d');
            octx.drawImage(img, 0, 0, odw, odh);
            octx.globalCompositeOperation = 'source-in';
            octx.fillStyle = logoColor;
            octx.fillRect(0, 0, odw, odh);
            ctx.drawImage(oc, dx, dy, dw, dh);
        }
    }
}

function drawTextBgCell(x, y, w, h) {
    let rx = Math.round(x), ry = Math.round(y), rw = Math.round(x+w)-rx, rh = Math.round(y+h)-ry;
    fill(logoColor); noStroke(); rect(rx, ry, rw, rh);
}

// Create a new text block entry with its own absolutely-positioned HTML overlay.
// level 0 = H2 (first block), 1 = H3 (second), 2+ = H4 (third onwards)
function addTextBlock(initialText) {
    let level = textBlocks.length; // index at time of creation
    let fontSize = level === 0 ? 'clamp(28px, 9cqi, 72px)'   // H2
                 : level === 1 ? 'clamp(20px, 6.5cqi, 52px)' // H3
                 :               'clamp(13px, 4.2cqi, 34px)'; // H4
    let el = document.createElement('div');
    css(el, {
        position: 'fixed', display: 'none', overflow: 'visible',
        background: 'transparent', padding: '12px', boxSizing: 'border-box',
        border: `1px solid ${bgColor}`,
        containerType: 'inline-size', pointerEvents: 'none', zIndex: '4',
    });
    let p = document.createElement('p');
    p.style.cssText = [
        'margin:0',
        `font-size:${fontSize}`,
        'line-height:1',
        'overflow-wrap:break-word',
        'word-break:break-word',
        "font-family:'TimesNowLight', serif",
        `color:${bgColor}`,
        'text-wrap:pretty',
    ].join(';');
    p.textContent = initialText || '';
    el.appendChild(p);
    document.body.appendChild(el);
    let tb = { text: initialText || '', el, paraEl: p, bounds: null, level };
    textBlocks.push(tb);
    return tb;
}

// ── export ────────────────────────────────────────────────────────────────────

function savePNG() {
    saveCanvas('mit-tool-' + Date.now(), 'png');
}

function saveSVG() {
    let png = canvas.elt.toDataURL('image/png');
    let w = canvas.width, h = canvas.height;
    let svg = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
        `     width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
        `  <image width="${w}" height="${h}" xlink:href="${png}"/>`,
        '</svg>'
    ].join('\n');
    let blob = new Blob([svg], { type: 'image/svg+xml' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mit-tool-' + Date.now() + '.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// ── UI ────────────────────────────────────────────────────────────────────────

function buildUI() {
    let panel = document.createElement('div');
    css(panel, {
        position: 'fixed', top: '16px', right: '16px', zIndex: '10',
        display: 'flex', flexDirection: 'column', gap: '5px',
        background: 'rgba(200,200,200,0.85)', padding: '8px 10px',
        borderRadius: '10px', fontFamily: 'monospace', fontSize: '10px',
        color: '#222', userSelect: 'none', width: '130px'
    });

    let title = document.createElement('div');
    title.textContent = 'Grid Configuration';
    css(title, { fontWeight: 'bold', opacity: '0.7' });
    panel.appendChild(title);

    // Two button groups; all buttons share one active-state tracker so
    // clicking either group deselects the other.
    let slicesCtrl, cellCtrl, imagesSliderCtrl, imagesCtrl, randomLogoCtrl, camHCtrl, camVCtrl, gridCtrl, logoOnlyCtrl, logoSizeCtrl;
    let allModeButtons = []; // filled below, used to sync highlight across both groups

    function makeModeBtn(label, modeKey) {
        let btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.mode = modeKey;
        css(btn, {
            flex: '1 1 calc(50% - 4px)', padding: '3px 0', border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px',
            cursor: 'pointer', background: modeKey === movement
                ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)'
        });
        allModeButtons.push(btn);
        btn.addEventListener('click', () => {
            movement = btn.dataset.mode;
            allModeButtons.forEach(b => {
                b.style.background = b.dataset.mode === movement
                    ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.5)';
            });
            if (movement === 'xyz') {
                setupXYZ();
                if (xyzEl) xyzEl.style.display = 'block';
                camSection.style.display = 'flex';
                camHCtrl.set(15); camVCtrl.set(0);
                slicesCtrl.set(3);  cellCtrl.set(0.15); imagesSliderCtrl.set(29);
                imagesCtrl.set(false); showOutline = false; randomLogoCtrl.set(false);
            } else {
                if (xyzEl) xyzEl.style.display = 'none';
                camSection.style.display = 'none';
                if (movement === 'xy') {
                    slicesCtrl.set(5);  cellCtrl.set(0.10); imagesSliderCtrl.set(14);
                    imagesCtrl.set(false); showOutline = false; randomLogoCtrl.set(false);
                    gridCtrl.set(false);
                }
                if (movement === 'swarm') {
                    swarmPoints = [];
                    slicesCtrl.set(8);  cellCtrl.set(0.25); imagesSliderCtrl.set(6);
                    imagesCtrl.set(false); showOutline = false; randomLogoCtrl.set(false);
                    gridCtrl.set(false);
                }
                if (movement === 'organic') {
                    mitosisMap.clear();
                    slicesCtrl.set(5);  cellCtrl.set(0.20); imagesSliderCtrl.set(5);
                    imagesCtrl.set(false); showOutline = false; randomLogoCtrl.set(false);
                    gridCtrl.set(false);
                }
                if (movement === 'expand')  {
                    expanders = []; expandTT = 0;
                    slicesCtrl.set(5); cellCtrl.set(0.25); showOutline = false;
                    gridCtrl.set(false); logoOnlyCtrl.set(true);
                }
                if (movement === 'burst') {
                    burstTT = 0; burstDroplets = []; burstSeedCache = [];
                    burstCanvas = null; burstCanvasKey = ''; burstSpawnTimer = 0;
                    initBurstAttractors();
                    slicesCtrl.set(6); cellCtrl.set(0.25); logoSizeCtrl.set(0.7);
                    showOutline = false; gridCtrl.set(false); logoOnlyCtrl.set(false);
                }
            }
        });
        return btn;
    }

    // Grid Configuration group — Fast (xy) and Slow (swarm)
    let gridRow = document.createElement('div');
    css(gridRow, { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    [['Fast', 'xy'], ['Slow', 'swarm']].forEach(([label, key]) => gridRow.appendChild(makeModeBtn(label, key)));
    panel.appendChild(gridRow);

    // Cell Behaviour heading + group
    let cellBehaviourTitle = document.createElement('div');
    cellBehaviourTitle.textContent = 'Cell Behaviour';
    css(cellBehaviourTitle, { fontWeight: 'bold', opacity: '0.7', marginTop: '2px' });
    panel.appendChild(cellBehaviourTitle);

    let cellRow = document.createElement('div');
    css(cellRow, { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    [['x/y/z', 'xyz'], ['Divide', 'organic'], ['Grow', 'expand'], ['Burst', 'burst']].forEach(([label, key]) => cellRow.appendChild(makeModeBtn(label, key)));
    panel.appendChild(cellRow);

    // Camera orbit sliders — only visible in xyz mode
    let camSection = document.createElement('div');
    css(camSection, { display: 'none', flexDirection: 'column', gap: '6px' });
    camHCtrl = addSliderRow(camSection, 'h-rotate', -45, 45, xyzCamH, 1, v => { xyzCamH = v; });
    camVCtrl = addSliderRow(camSection, 'v-tilt',   -45, 45, xyzCamV, 1, v => { xyzCamV = v; });
    panel.appendChild(camSection);

    let hr0 = document.createElement('div');
    css(hr0, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr0);

    slicesCtrl = addSliderRow(panel, 'slices',    2,   12,    maxDepth, 1,    v => { maxDepth = v; });
    cellCtrl   = addSliderRow(panel, 'cell size', 0, 0.45,   minRatio, 0.01, v => { minRatio = v; });

    // ── Logo section ──────────────────────────────────────────────────────────
    let logoHeading = document.createElement('div');
    logoHeading.textContent = 'Logo';
    css(logoHeading, { fontWeight: 'bold', opacity: '0.7', marginTop: '2px' });
    panel.appendChild(logoHeading);

    const LOGO_SET_OPTS = [['SA+P', 'sap'], ['MIT SA+P', 'mitsap'], ['Full', 'full']];
    let logoSetCbs = {};
    let logoSetUpdating = false;
    LOGO_SET_OPTS.forEach(([label, key]) => {
        let ctrl = addCheckbox(panel, label, key === activeLogoSetKey, v => {
            if (logoSetUpdating) return;
            if (!v) { ctrl.set(true); return; }
            logoSetUpdating = true;
            LOGO_SET_OPTS.forEach(([, k]) => { if (k !== key) logoSetCbs[k].set(false); });
            logoSetUpdating = false;
            switchLogoSet(key);
        });
        logoSetCbs[key] = ctrl;
    });

    // Upload custom logo
    let uploadRow = document.createElement('div');
    css(uploadRow, { display: 'flex', alignItems: 'center', gap: '4px' });
    let logoFileInput = document.createElement('input');
    logoFileInput.type = 'file'; logoFileInput.accept = '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg';
    css(logoFileInput, { fontSize: '10px', flex: '1', minWidth: '0' });
    let clearUploadBtn = document.createElement('button');
    clearUploadBtn.textContent = '×';
    css(clearUploadBtn, { fontSize: '11px', padding: '1px 5px', cursor: 'pointer', display: 'none' });
    logoFileInput.addEventListener('change', () => {
        let file = logoFileInput.files[0];
        if (!file) return;
        let isRaster = /\.(png|jpe?g)$/i.test(file.name) || file.type === 'image/png' || file.type === 'image/jpeg';
        let img = new Image();
        img.onload = () => {
            _uploadedIsRaster = isRaster;
            applyUploadedLogo(img);
            clearUploadBtn.style.display = 'inline';
        };
        img.src = URL.createObjectURL(file);
    });
    clearUploadBtn.addEventListener('click', () => {
        clearUploadedLogo(); logoFileInput.value = ''; clearUploadBtn.style.display = 'none';
    });
    uploadRow.appendChild(logoFileInput);
    uploadRow.appendChild(clearUploadBtn);
    panel.appendChild(uploadRow);

    randomLogoCtrl = addCheckbox(panel, 'randomise logo', randomLogo, v => {
        randomLogo = v;
        logoFrameTimer = 0;
        _logoShuffleQueue = [];
        if (!v) switchLogo(Math.min(RAND_LOGOS.length - 1, logoIdx));
    });

    // ── Images section ────────────────────────────────────────────────────────
    let imagesHeading = document.createElement('div');
    imagesHeading.textContent = 'Images';
    css(imagesHeading, { fontWeight: 'bold', opacity: '0.7', marginTop: '2px' });
    panel.appendChild(imagesHeading);

    imagesCtrl      = addCheckbox(panel, 'show images',   showImages, v => { showImages = v; });
    imagesSliderCtrl= addSliderRow(panel, 'images', 1, EXTRA_IMAGES_SRC.length, imgCount, 1, v => { imgCount = v; });

    // ── Colours section ───────────────────────────────────────────────────────
    let colHeading = document.createElement('div');
    colHeading.textContent = 'Colours';
    css(colHeading, { fontWeight: 'bold', opacity: '0.7', marginTop: '2px' });
    panel.appendChild(colHeading);

    let bgColorCtrl   = addColorRow(panel, 'background', bgColor, v => {
        bgColor = v;
        textBlocks.forEach(tb => {
            if (tb.paraEl) tb.paraEl.style.color = v;
            if (tb.el) tb.el.style.borderColor = v;
        });
        if (xyzScene) {
            xyzScene.background = new THREE.Color(bgColor);
            if (xyzBlankMat) xyzBlankMat.color.set(bgColor);
            if (xyzGridMat)  xyzGridMat.color.set(bgColor);
        }
        if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
    });
    let logoColorCtrl = addColorRow(panel, 'logo', logoColor, v => {
        logoColor = v;
        if (xyzReady && xyzLogoMat) rebuildXYZLogoTex();
    });

    // Colour preset swatches
    let swatchRow = document.createElement('div');
    css(swatchRow, { display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' });
    COLOR_PRESETS.forEach(p => {
        let sw = document.createElement('div');
        css(sw, { width: '32px', height: '16px', cursor: 'pointer', borderRadius: '3px',
                  overflow: 'hidden', display: 'flex', border: '1px solid rgba(0,0,0,0.18)', flexShrink: '0' });
        let lh = document.createElement('div');
        css(lh, { flex: '1', background: p.bg });
        let rh = document.createElement('div');
        css(rh, { flex: '1', background: p.logo });
        sw.appendChild(lh); sw.appendChild(rh);
        sw.title = `bg ${p.bg}  /  logo ${p.logo}`;
        sw.addEventListener('click', () => { bgColorCtrl.set(p.bg); logoColorCtrl.set(p.logo); });
        swatchRow.appendChild(sw);
    });
    panel.appendChild(swatchRow);

    // ── Other display options ─────────────────────────────────────────────────
    let hr1 = document.createElement('div');
    css(hr1, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr1);

    gridCtrl =           addCheckbox(panel, 'grid lines',   showGrid,    v => { showGrid = v; });
                     addCheckbox(panel, 'lines & logo', false, v => { showLinesLogo = v; });
                     addCheckbox(panel, 'voronoi',    showVoronoi, v => { showVoronoi = v; });
    logoOnlyCtrl =   addCheckbox(panel, 'logo only',  logoOnly,    v => { logoOnly = v; });
    logoSizeCtrl =   addSliderRow(panel, 'logo size', 0.2, 1.0, logoScale, 0.01, v => { logoScale = v; });

    // ── Content cells section ─────────────────────────────────────────────────
    let hr2 = document.createElement('hr');
    css(hr2, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr2);

    // SVG headings (multiple)
    let headingsDiv = document.createElement('div');
    css(headingsDiv, { display: 'flex', flexDirection: 'column', gap: '3px' });

    function addHeadingUI(img, filename) {
        headingImgs.push(img);
        let row = document.createElement('div');
        css(row, { display: 'flex', alignItems: 'center', gap: '4px' });
        let lbl = document.createElement('span');
        lbl.textContent = filename;
        css(lbl, { fontSize: '10px', flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
        let removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        css(removeBtn, { fontSize: '10px', padding: '2px 4px', cursor: 'pointer' });
        removeBtn.addEventListener('click', () => {
            let idx = headingImgs.indexOf(img);
            if (idx !== -1) headingImgs.splice(idx, 1);
            headingsDiv.removeChild(row);
        });
        row.appendChild(lbl);
        row.appendChild(removeBtn);
        headingsDiv.appendChild(row);
    }

    let headingFileInput = document.createElement('input');
    headingFileInput.type = 'file';
    headingFileInput.accept = '.svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg';
    headingFileInput.multiple = true;
    headingFileInput.style.display = 'none';
    headingFileInput.addEventListener('change', () => {
        for (let file of headingFileInput.files) {
            let isRaster = !file.type.includes('svg');
            let url = URL.createObjectURL(file);
            let img = new Image();
            img._isRaster = isRaster;
            let name = file.name;
            img.onload = () => { addHeadingUI(img, name); };
            img.src = url;
        }
        headingFileInput.value = '';
    });
    panel.appendChild(headingFileInput);

    let addHeadingBtn = document.createElement('button');
    addHeadingBtn.textContent = '+ add heading';
    css(addHeadingBtn, { fontSize: '11px', padding: '3px 6px', cursor: 'pointer', alignSelf: 'flex-start' });
    addHeadingBtn.addEventListener('click', () => headingFileInput.click());
    panel.appendChild(addHeadingBtn);
    panel.appendChild(headingsDiv);

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

    let addTextBtn = document.createElement('button');
    addTextBtn.textContent = '+ add text block';
    css(addTextBtn, { fontSize: '11px', padding: '3px 6px', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '2px' });
    addTextBtn.addEventListener('click', () => {
        let tb = addTextBlock('');
        addTextBlockUI(tb);
    });
    panel.appendChild(addTextBtn);
    // ── end content cells ─────────────────────────────────────────────────────

    // ── Playback + export ─────────────────────────────────────────────────────
    let hr3 = document.createElement('hr');
    css(hr3, { borderTop: '1px solid rgba(0,0,0,0.15)', margin: '2px 0' });
    panel.appendChild(hr3);

    // Pause / play button
    let pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'pause';
    css(pauseBtn, { fontSize: '11px', padding: '3px 6px', cursor: 'pointer', width: '100%' });

    // Seed slider — shown only when paused
    let seedRow = document.createElement('div');
    seedRow.style.display = 'none';
    let seedCtrl = addSliderRow(seedRow, 'seed', 0, 600, 0, 1, v => {
        if (!paused) return;
        // Scrub all timers proportionally from the seed value
        tt    = v * 3;
        ttTgt = tt;
        swarmTT  = v * 3.6;
        expandTT = v * 0.5;
    });

    pauseBtn.addEventListener('click', () => {
        paused = !paused;
        pauseBtn.textContent = paused ? 'play' : 'pause';
        seedRow.style.display = paused ? 'block' : 'none';
        if (paused) loop(); // keep draw() ticking so the frozen frame still renders
    });

    panel.appendChild(pauseBtn);
    panel.appendChild(seedRow);

    // Save buttons
    let saveRow = document.createElement('div');
    css(saveRow, { display: 'flex', gap: '4px' });
    let savePngBtn = document.createElement('button');
    savePngBtn.textContent = 'save png';
    css(savePngBtn, { flex: '1', fontSize: '11px', padding: '3px 4px', cursor: 'pointer' });
    savePngBtn.addEventListener('click', savePNG);
    let saveSvgBtn = document.createElement('button');
    saveSvgBtn.textContent = 'save svg';
    css(saveSvgBtn, { flex: '1', fontSize: '11px', padding: '3px 4px', cursor: 'pointer' });
    saveSvgBtn.addEventListener('click', saveSVG);
    saveRow.appendChild(savePngBtn);
    saveRow.appendChild(saveSvgBtn);
    panel.appendChild(saveRow);
    // ── end playback + export ─────────────────────────────────────────────────

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

function addColorRow(parent, label, value, onChange) {
    let row = document.createElement('div');
    css(row, { display: 'flex', alignItems: 'center', gap: '6px', opacity: '0.8' });
    let lbl = document.createElement('span');
    lbl.textContent = label;
    css(lbl, { fontSize: '11px', flex: '1' });
    let input = document.createElement('input');
    input.type = 'color'; input.value = value;
    css(input, { width: '36px', height: '17px', padding: '1px', border: 'none', cursor: 'pointer', background: 'none' });
    input.addEventListener('input', () => onChange(input.value));
    row.appendChild(lbl);
    row.appendChild(input);
    parent.appendChild(row);
    return { set: v => { input.value = v; onChange(v); } };
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
