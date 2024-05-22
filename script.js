document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const audio = new Audio('https://rosveluz.github.io/cosmicgarden/assets/final%20final.mp3');
    const video = document.getElementById('bg-video');

    startButton.addEventListener('click', () => {
        audio.loop = true;
        audio.play().catch(error => console.error('Audio play failed:', error));
        
        video.play().catch(error => console.error('Video play failed:', error));

        startButton.style.display = 'none'; // Hide the start button after interaction
    });

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var canvas = document.getElementById('torusCanvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(null);

    function createGlowTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    }

    var glowTexture = createGlowTexture(new THREE.Color(0xffffff));

    var customPath = new THREE.Curve();
    customPath.getPoint = function (t) {
        var radius = 12;
        var tubeRadius = 3;
        var angle = 2 * Math.PI * t;
        var x = (radius + tubeRadius * Math.cos(20 * angle)) * Math.cos(3 * angle);
        var y = (radius + tubeRadius * Math.cos(20 * angle)) * Math.sin(3 * angle);
        var z = tubeRadius * Math.sin(20 * angle);
        return new THREE.Vector3(x, y, z);
    };

    var points = [];
    for (var i = 0; i < 1000; i++) {
        var t = i / 999;
        points.push(customPath.getPoint(t));
    }
    var helixGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var helixMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var helixPath = new THREE.Line(helixGeometry, helixMaterial);
    scene.add(helixPath);

    var particleCount = 100;
    var particlePositions = new Float32Array(particleCount * 3);
    var particleTimes = new Float32Array(particleCount);
    var particleSpeeds = new Float32Array(particleCount);

    var pMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xFFFFFF,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true
    });

    var particles = [];
    for (let i = 0; i < particleCount; i++) {
        var sprite = new THREE.Sprite(pMaterial);
        scene.add(sprite);
        particles.push(sprite);
    }

    for (let i = 0; i < particleCount; i++) {
        var t = Math.random();
        particleTimes[i] = t;
        particleSpeeds[i] = Math.random() * 0.0001 + 0.00001;
        var point = customPath.getPoint(t);
        particlePositions[i * 3] = point.x;
        particlePositions[i * 3 + 1] = point.y;
        particlePositions[i * 3 + 2] = point.z;
        particles[i].position.set(point.x, point.y, point.z);
    }

    camera.position.y = -24;
    camera.position.z = 12;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    helixPath.visible = false;

    function updateParticles() {
        for (let i = 0; i < particleTimes.length; i++) {
            particleTimes[i] += particleSpeeds[i];
            if (particleTimes[i] > 1) particleTimes[i] -= 1;
            var point = customPath.getPoint(particleTimes[i]);
            particles[i].position.set(point.x, point.y, point.z);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        updateParticles();
        renderer.render(scene, camera);
    }

    animate();
});
