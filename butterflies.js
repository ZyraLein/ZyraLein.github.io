(() => {
    const canvas = document.querySelector(".butterfly-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COUNT = matchMedia("(max-width: 680px)").matches ? 1 : 2;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
        canvas.hidden = true; // no WebGL: just skip the butterflies
        return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 10;
    let halfW = 5, halfH = 4;

    /* Wing texture: pastel gradient, soft veins, white spots */
    const palettes = [
        ["#ffd1e8", "#f08cc4"],
        ["#e3d4ff", "#a98af0"],
        ["#cfe9ff", "#7cb6ee"],
        ["#ffe1ef", "#c98bf0"],
    ];

    function makeTexture([a, b]) {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d");
        const grad = g.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, a);
        grad.addColorStop(1, b);
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);

        g.strokeStyle = "rgba(255,255,255,.55)";
        g.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(0, 128);
        g.quadraticCurveTo(110, 40 + i * 45, 250, 20 + i * 50);
        g.stroke();
        }

        g.fillStyle = "rgba(255,255,255,.75)";
        [[210, 70, 13], [225, 130, 9], [180, 200, 11], [235, 185, 7]].forEach(([x, y, r]) => {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        });
        return new THREE.CanvasTexture(c);
    }
    const textures = palettes.map(makeTexture);

    /* One wing shape, shared by every butterfly (the left wing is a mirror) */
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.05);
    shape.bezierCurveTo(0.2, 0.9, 1.1, 1.3, 1.35, 0.75);
    shape.bezierCurveTo(1.5, 0.35, 1.0, 0.15, 0.75, 0.05);
    shape.bezierCurveTo(1.0, -0.1, 1.05, -0.75, 0.65, -0.85);
    shape.bezierCurveTo(0.3, -0.95, 0.05, -0.5, 0, -0.1);
    shape.lineTo(0, 0.05);

    const wingGeo = new THREE.ShapeGeometry(shape, 24);
    const pos = wingGeo.attributes.position;
    const uv = wingGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, pos.getX(i) / 1.5, (pos.getY(i) + 1) / 2.1);
    }

    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x935578 });
    const bodyGeo = new THREE.CylinderGeometry(0.045, 0.03, 0.9, 8);
    const headGeo = new THREE.SphereGeometry(0.075, 10, 10);
    const rand = (min, max) => min + Math.random() * (max - min);

    const portrait = document.querySelector(".portrait");
        const orbit = { rx: 4, ry: 4 };
        const sq = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

        // loop shaped like the portrait frame (a rounded rectangle), not a plain ellipse
        function posAt(u, t) {
        const th = u.dir * t * u.speed + u.phase;
        const wob = 1 + u.wob * Math.sin(t * u.wobSpeed + u.phase * 2);
        return {
            x: sq(Math.cos(th), 0.75) * orbit.rx * wob * u.lane,
            y: sq(Math.sin(th), 0.75) * orbit.ry * wob * u.lane,
            z: Math.sin(t * u.sz + u.phase) * 0.6,
        };
        }

    function makeButterfly(i) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({
        map: textures[i % textures.length],
        side: THREE.DoubleSide,
        });

        const right = new THREE.Group();
        const left = new THREE.Group();
        const rightWing = new THREE.Mesh(wingGeo, mat);
        const leftWing = new THREE.Mesh(wingGeo, mat);
        leftWing.scale.x = -1;
        right.add(rightWing);
        left.add(leftWing);

        const body = new THREE.Mesh(bodyGeo, bodyMat);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 0.48;

        group.add(body, head, right, left);
        group.scale.setScalar(rand(0.32, 0.5));

        group.userData = {
            right, left,
            phase: (i / COUNT) * Math.PI * 2 + rand(-0.4, 0.4),
            dir: i % 2 === 0 ? 1 : -1,        // some go clockwise, some the other way
            speed: rand(0.18, 0.3),
            lane: rand(1, 1.1),               // each one flies a slightly different distance out
            wob: rand(0.03, 0.07),
            wobSpeed: rand(0.6, 1.2),
            flap: rand(7, 11),
            sz: rand(0.3, 0.6),
        };

        scene.add(group);
        return group;
    }

    const butterflies = Array.from({ length: COUNT }, (_, i) => makeButterfly(i));

    function update(t) {
        butterflies.forEach((b) => {
            const u = b.userData;
            const p = posAt(u, t);
            const q = posAt(u, t + 0.05);

            b.position.set(p.x, p.y, p.z);
            // head points where it is flying
            b.rotation.z = Math.atan2(-(q.x - p.x), q.y - p.y);
            b.rotation.x = -0.6 + Math.sin(t * 1.3 + u.phase) * 0.12;

            const wing = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(t * u.flap + u.phase));
            u.right.rotation.y = wing;
            u.left.rotation.y = -wing;
        });
    }

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        halfH = Math.tan(THREE.MathUtils.degToRad(22.5)) * camera.position.z;
        halfW = halfH * camera.aspect;

        // size the loop from the real portrait, so it stays outside the face on any screen
        const pr = portrait.getBoundingClientRect();
        const unit = (halfW * 2) / w;      // world units per pixel
        const margin = 36;                 // px beyond the frame
        orbit.rx = Math.min((pr.width / 2 + margin) * unit, halfW * 0.94);
        orbit.ry = Math.min((pr.height / 2 + margin) * unit, halfH * 0.94);

        if (reduceMotion) {
            update(0);
            renderer.render(scene, camera);
        }
    }
    
    new ResizeObserver(resize).observe(canvas);
    resize();

    if (reduceMotion) return; // one still frame, no animation

    let visible = true;
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

    const clock = new THREE.Clock();
    (function loop() {
        requestAnimationFrame(loop);
        if (!visible) return; // pause when the hero is off screen
        update(clock.getElapsedTime());
        renderer.render(scene, camera);
    })();
})();