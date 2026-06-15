let svgEl;
let svgLoaded = false;
const SVG_W = 341, SVG_H = 100;

let tt = 0, ttTgt = 1, frame = 0, canvas;
var ran = Math.random() * 10;
let maxDepth = 8;
let minRatio = 0;

function setup() {
    frameRate(30);
    canvas = createCanvas(window.innerWidth, window.innerHeight);

    svgEl = new Image();
    svgEl.onload = () => { svgLoaded = true; };
    svgEl.src = 'images/logo-1.svg';

    buildUI();
}

function draw() {
    frame++;
    tt += (ttTgt - tt) / 4;
    if (frame % 30 == 0) ttTgt = frame * 2;
    if (tt % 600 == 0) ran = Math.random() * 10;

    background(255);
    if (!svgLoaded) return;
    splitLogo(0, 0, canvas.width, canvas.height, 0, 0, SVG_W, SVG_H, 0, 1);
}

// ── Logo slice ────────────────────────────────────────────────────────────────

function drawRegion(x, y, w, h, ix, iy, iw, ih) {
    if (w < 0.5 || h < 0.5 || iw < 0.01 || ih < 0.01) return;
    let scaleX = w / iw;
    let scaleY = h / ih;
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(svgEl, x - ix * scaleX, y - iy * scaleY, SVG_W * scaleX, SVG_H * scaleY);
    ctx.restore();
}

function splitLogo(x, y, w, h, ix, iy, iw, ih, n, nodeId) {
    randomSeed(nodeId + floor(ran * 100));

    if ((random() < 0.2 && n > 3) || n > maxDepth) {
        drawRegion(x, y, w, h, ix, iy, iw, ih);
    } else {
        let crx = 0.5 + 0.5 * Math.sin(tt * (0.01 + n * 0.01) + n * 50);
        crx = Math.max(Math.min(crx, 1 - minRatio), minRatio);
        let cry = 0.5 + 0.5 * Math.cos(tt * (0.01 + n * 0.01) + n * 9930);
        cry = Math.max(Math.min(cry, 1 - minRatio), minRatio);

        let ww = w * crx,   ww2 = w * (1 - crx);
        let hh = h * cry,   hh2 = h * (1 - cry);
        let iww = iw * 0.5, iww2 = iw * 0.5;
        let ihh = ih * 0.5, ihh2 = ih * 0.5;

        if (n <= 1) {
            splitLogo(x,     y,    ww,  hh,  ix,      iy,      iww,  ihh,  n+1, nodeId*4+0);
            splitLogo(x+ww,  y,    ww2, hh,  ix+iww,  iy,      iww2, ihh,  n+1, nodeId*4+1);
            splitLogo(x,     y+hh, ww,  hh2, ix,      iy+ihh,  iww,  ihh2, n+1, nodeId*4+2);
            splitLogo(x+ww,  y+hh, ww2, hh2, ix+iww,  iy+ihh,  iww2, ihh2, n+1, nodeId*4+3);
        } else if (nodeId % 2 == 0) {
            splitLogo(x,    y, ww,  h, ix,     iy, iww,  ih, n+1, nodeId*2+0);
            splitLogo(x+ww, y, ww2, h, ix+iww, iy, iww2, ih, n+1, nodeId*2+1);
        } else {
            splitLogo(x, y,    w, hh,  ix, iy,     iw, ihh,  n+1, nodeId*2+0);
            splitLogo(x, y+hh, w, hh2, ix, iy+ihh, iw, ihh2, n+1, nodeId*2+1);
        }
    }
}

// ── UI ────────────────────────────────────────────────────────────────────────

function buildUI() {
    let panel = document.createElement('div');
    css(panel, {
        position: 'fixed', top: '16px', right: '16px', zIndex: '10',
        display: 'flex', flexDirection: 'column', gap: '8px',
        background: 'rgba(200,200,200,0.85)',
        padding: '10px 12px', borderRadius: '10px',
        fontFamily: 'monospace', fontSize: '10px',
        color: '#222', userSelect: 'none', width: '130px'
    });

    addSliderRow(panel, 'slices',    2,    12,  maxDepth, 1,    v => { maxDepth = v; });
    addSliderRow(panel, 'cell size', 0,  0.45,  minRatio, 0.01, v => { minRatio = v; });

    document.body.appendChild(panel);
}

function addSliderRow(parent, label, min, max, val, step, onChange) {
    let wrap = document.createElement('div');
    css(wrap, { display: 'flex', flexDirection: 'column', gap: '2px' });

    let header = document.createElement('div');
    css(header, { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' });

    let name = document.createElement('span');
    name.textContent = label;
    css(name, { opacity: '0.6' });
    header.appendChild(name);

    let valLabel = document.createElement('span');
    valLabel.textContent = (step < 1) ? parseFloat(val).toFixed(2) : val;
    css(valLabel, { opacity: '0.5' });
    header.appendChild(valLabel);

    wrap.appendChild(header);

    let slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min; slider.max = max; slider.value = val; slider.step = step;
    css(slider, { width: '100%', cursor: 'pointer', margin: '0' });
    slider.addEventListener('input', () => {
        let v = parseFloat(slider.value);
        onChange(v);
        valLabel.textContent = (step < 1) ? v.toFixed(2) : v;
    });
    wrap.appendChild(slider);

    parent.appendChild(wrap);
}

function css(el, styles) {
    Object.assign(el.style, styles);
}
