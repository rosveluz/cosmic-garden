document.addEventListener('DOMContentLoaded', () => {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var canvas = document.getElementById('torusCanvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(null);

    // Function to create glow texture
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

    // Create the glow texture
    var glowTexture = createGlowTexture(new THREE.Color(0xffffff));

    // Define a custom helical path using THREE.Curve
    var customPath = new THREE.Curve();
    customPath.getPoint = function (t) {
        var radius = 12; // Radius of the whole torus
        var tubeRadius = 3; // This will affect how far out the helix extends
        var angle = 2 * Math.PI * t;
        var x = (radius + tubeRadius * Math.cos(20 * angle)) * Math.cos(3 * angle);
        var y = (radius + tubeRadius * Math.cos(20 * angle)) * Math.sin(3 * angle);
        var z = tubeRadius * Math.sin(20 * angle);
        return new THREE.Vector3(x, y, z);
    };

    // Create a geometry and line material for the helix path
    var points = [];
    for (var i = 0; i < 1000; i++) {
        var t = i / 999;
        points.push(customPath.getPoint(t));
    }
    var helixGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var helixMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var helixPath = new THREE.Line(helixGeometry, helixMaterial);
    scene.add(helixPath);

    // Particle system with glow
    var particleCount = 1000; // Initial particle count
    var particlePositions = new Float32Array(particleCount * 3); // Placeholder for particle positions
    var particleTimes = new Float32Array(particleCount); // Placeholder for particle times

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

    // Initialize particle positions and times
    for (let i = 0; i < particleCount; i++) {
        var t = Math.random();
        particleTimes[i] = t;
        var point = customPath.getPoint(t);
        particlePositions[i * 3] = point.x;
        particlePositions[i * 3 + 1] = point.y;
        particlePositions[i * 3 + 2] = point.z;
        particles[i].position.set(point.x, point.y, point.z);
    }

    camera.position.y = -24;
    camera.position.z = 12;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Hide the helix path
    helixPath.visible = false;

    var socket = new WebSocket('ws://127.0.0.1:8765/');
    socket.onmessage = function (event) {
        var audioData = JSON.parse(event.data);
        console.log('Received audio data:', audioData);
        adjustParticles(audioData);
    };

    socket.onerror = function (error) {
        console.error('WebSocket Error:', error);
    };

    socket.onopen = function () {
        console.log('WebSocket connection established');
    };

    socket.onclose = function () {
        console.log('WebSocket connection closed');
    };

    function adjustParticles(audioData) {
        var particleCount = mapAmplitudeToCount(audioData.amplitude);
        console.log('Number of particles:', particleCount); // Debugging info

        for (let i = 0; i < particleCount; i++) {
            var t = Math.random();
            particleTimes[i] = t;
            var point = customPath.getPoint(t);
            particles[i].position.set(point.x, point.y, point.z);
            particles[i].scale.setScalar(mapFrequencyToSize(audioData.frequency));
            particles[i].material.opacity = mapFrequencyToGlow(audioData.frequency);
        }
    }

    function mapFrequencyToSize(frequency) {
        return Math.random() * (60 - 20) + 20; // Random size between 20 and 60
    }

    function mapFrequencyToGlow(frequency) {
        return Math.min(frequency / 100, 1); // Map frequency to opacity for glow effect
    }

    function mapAmplitudeToCount(amplitude) {
        return Math.floor(2 + Math.random() * (40 - 2) * amplitude / 10); // Random count based on amplitude
    }

    function updateParticles() {
        for (let i = 0; i < particleTimes.length; i++) {
            particleTimes[i] += 0.001; // Increment time
            if (particleTimes[i] > 1) particleTimes[i] -= 1; // Loop the time
            var point = customPath.getPoint(particleTimes[i]);
            particles[i].position.set(point.x, point.y, point.z);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        updateParticles(); // Update particle positions
        renderer.render(scene, camera);
    }

    animate();
});
