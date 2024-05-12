document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Select the existing canvas element
    var canvas = document.getElementById('torusCanvas');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Torus geometry
    var geometry = new THREE.TorusGeometry(12, 3, 32, 100);
    var material = new THREE.MeshBasicMaterial({ color: 0xAAAAAA, wireframe: true });
    var torus = new THREE.Mesh(geometry, material);
    scene.add(torus);

    // Tilt the camera by changing its position
    camera.position.y = -24; // Elevate the camera on the Y-axis
    camera.position.z = 12; // Move the camera back on the Z-axis

    // Make the camera look at the torus center
    camera.lookAt(torus.position);

    torus.visible = true;

    // WebSocket setup
    var socket = new WebSocket('ws://localhost:5678/');

    socket.onmessage = function(event) {
        var audioData = JSON.parse(event.data);
        console.log('Received audio data:', audioData);

        // Use the data to create and animate particles along the torus
        animateParticles(audioData);
    };

    // Function to create particles and animate them based on audio data
    function animateParticles(audioData) {
        audioData.forEach(data => {
            console.log('Frequency:', data.frequency, 'Amplitude:', data.amplitude);
            // Here you would update or move particles along the torus based on the data

            // Example: adjust the torus size based on amplitude
            torus.scale.set(data.amplitude, data.amplitude, data.amplitude);
        });
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        // Rotate the torus for visual effect
        // torus.rotation.x += 0.01;
        // torus.rotation.y += 0.01;
        
        // Render the scene
        renderer.render(scene, camera);
    }

    animate();
});
