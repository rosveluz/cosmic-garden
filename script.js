document.addEventListener('DOMContentLoaded', () => {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var canvas = document.getElementById('torusCanvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(null);

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

    // Create a geometry and line material
    var points = [];
    for (var i = 0; i < 1000; i++) {
        var t = i / 999;
        points.push(customPath.getPoint(t));
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var helixPath = new THREE.Line(geometry, material);
    scene.add(helixPath);

    // Particle system
    var particleGeometry = new THREE.BufferGeometry();
    var positions = []; // Array to hold positions of all particles

    var pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    var particleSystem = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particleSystem);

    camera.position.y = -24;
    camera.position.z = 12;
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // Center of the scene

    var socket = new WebSocket('ws://localhost:8765/');
    socket.onmessage = function (event) {
        var audioData = JSON.parse(event.data);
        console.log('Received audio data:', audioData);
        adjustParticles(audioData);
    };

    function adjustParticles(audioData) {
        pMaterial.size = mapFrequencyToSize(audioData.frequency);
        
        var newParticlesCount = mapAmplitudeToCount(audioData.amplitude);
        for (let i = 0; i < newParticlesCount; i++) {
            positions.push(Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25);
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.attributes.position.needsUpdate = true;
    }

    function mapFrequencyToSize(frequency) {
        return frequency / 100; // Example mapping, adjust as needed
    }

    function mapAmplitudeToCount(amplitude) {
        return Math.floor(2 + Math.random() * (20 - 2) * amplitude / 10); // Random count based on amplitude
    }

    function animate() {
        requestAnimationFrame(animate);
        particleSystem.rotation.y += 0.01; // Rotate the system for visual effect
        renderer.render(scene, camera);
    }

    animate();
});
