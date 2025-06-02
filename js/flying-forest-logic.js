
    var ThemeColors = {
        light: {
            red: 0xf25346,
            yellow: 0xedeb27,
            white: 0xd8d0d1,
            brown: 0x59332e,
            pink: 0xF5986E,
            brownDark: 0x23190f,
            blue: 0x68c3c0,
            green: 0x458248, // Original tree leaves
            purple: 0x551A8B,
            lightgreen: 0x629265, // Original land color
            fog: 0xf7d9aa,       // Original fog color
            skyGradientStart: '#e4e0ba', // Original gradient from component
            skyGradientEnd: '#f7d9aa'    // Original gradient from component
        },
        dark: { // Night theme colors (adjust these to your liking)
            red: 0x9E2A2B,       // Darker Red
            yellow: 0x7E6C0A,    // Darker Yellow (less bright for moon/sun)
            white: 0x606060,     // Darker White / Grey for clouds
            brown: 0x3D2B1F,     // Darker Brown for tree trunks
            pink: 0x8C4A4A,      // Muted Pink/Red for flowers
            brownDark: 0x1A120B, // Very Dark Brown for airplane propeller
            blue: 0x3B6A68,      // Desaturated dark blue/teal for airplane accents
            green: 0x1E5631,     // Darker Green for tree leaves
            purple: 0x3A0A54,    // Darker Purple for flowers
            lightgreen: 0x2A3F2A, // Darker land color (e.g., dark moss)
            fog: 0x0D1326,       // Dark blue/purple fog
            skyGradientStart: '#080F20', // Dark sky gradient start (e.g., very dark blue)
            skyGradientEnd: '#151D36'    // Dark sky gradient end (e.g., dark indigo)
        }
    };

    var Colors; // This will hold the current theme's colors
    var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    Colors = ThemeColors[currentTheme]; // Initialize Colors

    var worldElement; // Declare globally for access in functions

    function updateForestThemeColors(theme) {
        currentTheme = theme;
        Colors = ThemeColors[theme]; // Update the global Colors object

        if (scene && scene.fog) {
            scene.fog.color.setHex(Colors.fog);
        }
        if (renderer) { // Ensure renderer is available
            // The canvas background itself is transparent (alpha:true in WebGLRenderer)
            // The #world div's background is what we change
            if (worldElement) {
                worldElement.style.background = `linear-gradient(${Colors.skyGradientStart}, ${Colors.skyGradientEnd})`;
            }
        }

        // Update material colors (example for land and sun)
        if (land && land.mesh && land.mesh.material) {
            land.mesh.material.color.setHex(Colors.lightgreen);
        }
        if (sun && sun.mesh && sun.mesh.children.length > 0 && sun.mesh.children[0].material) {
            sun.mesh.children[0].material.color.setHex(Colors.yellow);
        }
        if (airplane && airplane.mesh) {
            // Example: Airplane cockpit color
            const cockpit = airplane.mesh.children.find(child => child.geometry.type === "BoxGeometry" && child.material.color.getHex() === ThemeColors.light.red); // Find by original color
            if (cockpit) cockpit.material.color.setHex(Colors.red);

            const engine = airplane.mesh.children.find(child => child.geometry.type === "BoxGeometry" && child.material.color.getHex() === ThemeColors.light.white);
            if (engine) engine.material.color.setHex(Colors.white); // Example for engine

            // You'll need to do this for other parts of the airplane, trees, flowers if their colors
            // are hardcoded or need to change significantly.
        }
        // Trees might be tricky if they share materials. If `matTreeLeaves` is global:
        if (typeof matTreeLeaves !== 'undefined' && matTreeLeaves) {
            matTreeLeaves.color.setHex(Colors.green);
        }
        if (typeof matTreeBase !== 'undefined' && matTreeBase) {
            matTreeBase.color.setHex(Colors.brown);
        }
        // For clouds, if `Cloud` constructor is available and its material reference can be updated
        if (sky && sky.mesh && typeof Cloud !== 'undefined') {
            sky.mesh.children.forEach(cloudMesh => {
                if (cloudMesh.children.length > 0) {
                    cloudMesh.children.forEach(m => m.material.color.setHex(Colors.white));
                }
            });
        }
    }
    
    
    var Colors = {
        red: 0xf25346,
        yellow: 0xedeb27,
        white: 0xd8d0d1,
        brown: 0x59332e,
        pink: 0xF5986E,
        brownDark: 0x23190f,
        blue: 0x68c3c0,
        green: 0x458248,
        purple: 0x551A8B,
        lightgreen: 0x629265,
    };
    var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;

    function createScene() {
        worldElement = document.getElementById('world'); // Get the #world div

        // Use the wrapper's dimensions for the canvas
        HEIGHT = worldElement.clientHeight;
        WIDTH = worldElement.clientWidth;

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(Colors.fog, 100, 950); // Use themed fog color

        aspectRatio = WIDTH / HEIGHT;
        fieldOfView = 60; // You can adjust this
        nearPlane = 1;
        farPlane = 10000;
        camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.x = 0;
        camera.position.y = 100; // Adjust Y position to view the scene better
        camera.position.z = 300; // Pull camera back a bit
        camera.lookAt(new THREE.Vector3(0,50,0)); // Look slightly down if needed

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(WIDTH, HEIGHT);
        renderer.shadowMap.enabled = true;

        // Set initial background for #world div using themed colors
        worldElement.style.background = `linear-gradient(${Colors.skyGradientStart}, ${Colors.skyGradientEnd})`;

        container = worldElement; // The #world div is the container
        container.appendChild(renderer.domElement);

        window.addEventListener('resize', handleWindowResize, false);
    }

    function handleWindowResize() {
        if (worldElement) { // Check if worldElement exists
            HEIGHT = worldElement.clientHeight;
            WIDTH = worldElement.clientWidth;
            renderer.setSize(WIDTH, HEIGHT);
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();
        }
    }

    var hemispshereLight, shadowLight;

    function createLights() {
        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)
        shadowLight = new THREE.DirectionalLight(0xffffff, .9);
        shadowLight.position.set(0, 350, 350);
        shadowLight.castShadow = true;
        shadowLight.shadow.camera.left = -650;
        shadowLight.shadow.camera.right = 650;
        shadowLight.shadow.camera.top = 650;
        shadowLight.shadow.camera.bottom = -650;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;
        shadowLight.shadow.mapSize.width = 2048;
        shadowLight.shadow.mapSize.height = 2048;
        scene.add(hemisphereLight);
        scene.add(shadowLight)
    }

    Land = function () {
        var geom = new THREE.CylinderGeometry(600, 600, 1700, 40, 10);
        geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        // Use themed land color
        var mat = new THREE.MeshPhongMaterial({color: Colors.lightgreen, shading: THREE.FlatShading,});
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.receiveShadow = true
    }
    Orbit = function () {
        var geom = new THREE.Object3D();
        this.mesh = geom
    }
    Sun = function () {
        this.mesh = new THREE.Object3D();
        var sunGeom = new THREE.SphereGeometry(400, 20, 10);
        var sunMat = new THREE.MeshPhongMaterial({color: Colors.yellow, shading: THREE.FlatShading,});
        var sun = new THREE.Mesh(sunGeom, sunMat);
        sun.castShadow = false;
        sun.receiveShadow = false;
        this.mesh.add(sun)
    }
    Cloud = function () {
        this.mesh = new THREE.Object3D();
        var geom = new THREE.DodecahedronGeometry(20, 0);
        var mat = new THREE.MeshPhongMaterial({color: Colors.white,});
        var nBlocs = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < nBlocs; i++) {
            var m = new THREE.Mesh(geom, mat);
            m.position.x = i * 15;
            m.position.y = Math.random() * 10;
            m.position.z = Math.random() * 10;
            m.rotation.z = Math.random() * Math.PI * 2;
            m.rotation.y = Math.random() * Math.PI * 2;
            var s = .1 + Math.random() * .9;
            m.scale.set(s, s, s);
            this.mesh.add(m)
        }
    }
    Sky = function () {
        this.mesh = new THREE.Object3D();
        this.nClouds = 25;
        var stepAngle = Math.PI * 2 / this.nClouds;
        for (var i = 0; i < this.nClouds; i++) {
            var c = new Cloud();
            var a = stepAngle * i;
            var h = 800 + Math.random() * 200;
            c.mesh.position.y = Math.sin(a) * h;
            c.mesh.position.x = Math.cos(a) * h;
            c.mesh.rotation.z = a + Math.PI / 2;
            c.mesh.position.z = -400 - Math.random() * 400;
            var s = 1 + Math.random() * 2;
            c.mesh.scale.set(s, s, s);
            this.mesh.add(c.mesh)
        }
    }
    Tree = function () {
        this.mesh = new THREE.Object3D();
        var matTreeLeaves = new THREE.MeshPhongMaterial({color: Colors.green, shading: THREE.FlatShading});
        var geonTreeBase = new THREE.BoxGeometry(10, 20, 10);
        var matTreeBase = new THREE.MeshBasicMaterial({color: Colors.brown});
        var treeBase = new THREE.Mesh(geonTreeBase, matTreeBase);
        treeBase.castShadow = true;
        treeBase.receiveShadow = true;
        this.mesh.add(treeBase);
        var geomTreeLeaves1 = new THREE.CylinderGeometry(1, 12 * 3, 12 * 3, 4);
        var treeLeaves1 = new THREE.Mesh(geomTreeLeaves1, matTreeLeaves);
        treeLeaves1.castShadow = true;
        treeLeaves1.receiveShadow = true;
        treeLeaves1.position.y = 20
        this.mesh.add(treeLeaves1);
        var geomTreeLeaves2 = new THREE.CylinderGeometry(1, 9 * 3, 9 * 3, 4);
        var treeLeaves2 = new THREE.Mesh(geomTreeLeaves2, matTreeLeaves);
        treeLeaves2.castShadow = true;
        treeLeaves2.position.y = 40;
        treeLeaves2.receiveShadow = true;
        this.mesh.add(treeLeaves2);
        var geomTreeLeaves3 = new THREE.CylinderGeometry(1, 6 * 3, 6 * 3, 4);
        var treeLeaves3 = new THREE.Mesh(geomTreeLeaves3, matTreeLeaves);
        treeLeaves3.castShadow = true;
        treeLeaves3.position.y = 55;
        treeLeaves3.receiveShadow = true;
        this.mesh.add(treeLeaves3)
    }
    Flower = function () {
        this.mesh = new THREE.Object3D();
        var geomStem = new THREE.BoxGeometry(5, 50, 5, 1, 1, 1);
        var matStem = new THREE.MeshPhongMaterial({color: Colors.green, shading: THREE.FlatShading});
        var stem = new THREE.Mesh(geomStem, matStem);
        stem.castShadow = false;
        stem.receiveShadow = true;
        this.mesh.add(stem);
        var geomPetalCore = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
        var matPetalCore = new THREE.MeshPhongMaterial({color: Colors.yellow, shading: THREE.FlatShading});
        petalCore = new THREE.Mesh(geomPetalCore, matPetalCore);
        petalCore.castShadow = false;
        petalCore.receiveShadow = true;
        var petalColor = petalColors[Math.floor(Math.random() * 3)];
        var geomPetal = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        var matPetal = new THREE.MeshBasicMaterial({color: petalColor});
        geomPetal.vertices[5].y -= 4;
        geomPetal.vertices[4].y -= 4;
        geomPetal.vertices[7].y += 4;
        geomPetal.vertices[6].y += 4;
        geomPetal.translate(12.5, 0, 3);
        var petals = [];
        for (var i = 0; i < 4; i++) {
            petals[i] = new THREE.Mesh(geomPetal, matPetal);
            petals[i].rotation.z = i * Math.PI / 2;
            petals[i].castShadow = true;
            petals[i].receiveShadow = true
        }
        petalCore.add(petals[0], petals[1], petals[2], petals[3]);
        petalCore.position.y = 25;
        petalCore.position.z = 3;
        this.mesh.add(petalCore)
    }
    var petalColors = [Colors.red, Colors.yellow, Colors.blue];
    Forest = function () {
        this.mesh = new THREE.Object3D();
        this.nTrees = 300;
        var stepAngle = Math.PI * 2 / this.nTrees;
        for (var i = 0; i < this.nTrees; i++) {
            var t = new Tree();
            var a = stepAngle * i;
            var h = 605;
            t.mesh.position.y = Math.sin(a) * h;
            t.mesh.position.x = Math.cos(a) * h;
            t.mesh.rotation.z = a + (Math.PI / 2) * 3;
            t.mesh.position.z = 0 - Math.random() * 600;
            var s = .3 + Math.random() * .75;
            t.mesh.scale.set(s, s, s);
            this.mesh.add(t.mesh)
        }
        this.nFlowers = 350;
        var stepAngle = Math.PI * 2 / this.nFlowers;
        for (var i = 0; i < this.nFlowers; i++) {
            var f = new Flower();
            var a = stepAngle * i;
            var h = 605;
            f.mesh.position.y = Math.sin(a) * h;
            f.mesh.position.x = Math.cos(a) * h;
            f.mesh.rotation.z = a + (Math.PI / 2) * 3;
            f.mesh.position.z = 0 - Math.random() * 600;
            var s = .1 + Math.random() * .3;
            f.mesh.scale.set(s, s, s);
            this.mesh.add(f.mesh)
        }
    }
    var AirPlane = function () {
        this.mesh = new THREE.Object3D();
        var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
        var matCockpit = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
        geomCockpit.vertices[4].y -= 10;
        geomCockpit.vertices[4].z += 20;
        geomCockpit.vertices[5].y -= 10;
        geomCockpit.vertices[5].z -= 20;
        geomCockpit.vertices[6].y += 30;
        geomCockpit.vertices[6].z += 20;
        geomCockpit.vertices[7].y += 30;
        geomCockpit.vertices[7].z -= 20;
        var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);
        var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        var matEngine = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 40;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);
        var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        var matTailPlane = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
        var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-35, 25, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);
        var geomSideWing = new THREE.BoxGeometry(40, 4, 150, 1, 1, 1);
        var matSideWing = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
        var sideWingTop = new THREE.Mesh(geomSideWing, matSideWing);
        var sideWingBottom = new THREE.Mesh(geomSideWing, matSideWing);
        sideWingTop.castShadow = true;
        sideWingTop.receiveShadow = true;
        sideWingBottom.castShadow = true;
        sideWingBottom.receiveShadow = true;
        sideWingTop.position.set(20, 12, 0);
        sideWingBottom.position.set(20, -3, 0);
        this.mesh.add(sideWingTop);
        this.mesh.add(sideWingBottom);
        var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
        var matWindshield = new THREE.MeshPhongMaterial({
            color: Colors.white,
            transparent: true,
            opacity: .3,
            shading: THREE.FlatShading
        });
        var windshield = new THREE.Mesh(geomWindshield, matWindshield);
        windshield.position.set(5, 27, 0);
        windshield.castShadow = true;
        windshield.receiveShadow = true;
        this.mesh.add(windshield);
        var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        geomPropeller.vertices[4].y -= 5;
        geomPropeller.vertices[4].z += 5;
        geomPropeller.vertices[5].y -= 5;
        geomPropeller.vertices[5].z -= 5;
        geomPropeller.vertices[6].y += 5;
        geomPropeller.vertices[6].z += 5;
        geomPropeller.vertices[7].y += 5;
        geomPropeller.vertices[7].z -= 5;
        var matPropeller = new THREE.MeshPhongMaterial({color: Colors.brown, shading: THREE.FlatShading});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;
        var geomBlade1 = new THREE.BoxGeometry(1, 100, 10, 1, 1, 1);
        var geomBlade2 = new THREE.BoxGeometry(1, 10, 100, 1, 1, 1);
        var matBlade = new THREE.MeshPhongMaterial({color: Colors.brownDark, shading: THREE.FlatShading});
        var blade1 = new THREE.Mesh(geomBlade1, matBlade);
        blade1.position.set(8, 0, 0);
        blade1.castShadow = true;
        blade1.receiveShadow = true;
        var blade2 = new THREE.Mesh(geomBlade2, matBlade);
        blade2.position.set(8, 0, 0);
        blade2.castShadow = true;
        blade2.receiveShadow = true;
        this.propeller.add(blade1, blade2);
        this.propeller.position.set(50, 0, 0);
        this.mesh.add(this.propeller);
        var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
        var wheelProtecMat = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
        wheelProtecR.position.set(25, -20, 25);
        this.mesh.add(wheelProtecR);
        var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
        var wheelTireMat = new THREE.MeshPhongMaterial({color: Colors.brownDark, shading: THREE.FlatShading});
        var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
        wheelTireR.position.set(25, -28, 25);
        var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
        var wheelAxisMat = new THREE.MeshPhongMaterial({color: Colors.brown, shading: THREE.FlatShading});
        var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
        wheelTireR.add(wheelAxis);
        this.mesh.add(wheelTireR);
        var wheelProtecL = wheelProtecR.clone();
        wheelProtecL.position.z = -wheelProtecR.position.z;
        this.mesh.add(wheelProtecL);
        var wheelTireL = wheelTireR.clone();
        wheelTireL.position.z = -wheelTireR.position.z;
        this.mesh.add(wheelTireL);
        var wheelTireB = wheelTireR.clone();
        wheelTireB.scale.set(.5, .5, .5);
        wheelTireB.position.set(-35, -5, 0);
        this.mesh.add(wheelTireB);
        var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
        suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0))
        var suspensionMat = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
        var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
        suspension.position.set(-35, -5, 0);
        suspension.rotation.z = -.3;
        this.mesh.add(suspension)
    };
    var Fox = function () {
        this.mesh = new THREE.Object3D();
        var redFurMat = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
        var geomBody = new THREE.BoxGeometry(100, 50, 50, 1, 1, 1);
        var body = new THREE.Mesh(geomBody, redFurMat);
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        var geomChest = new THREE.BoxGeometry(50, 60, 70, 1, 1, 1);
        var chest = new THREE.Mesh(geomChest, redFurMat);
        chest.position.x = 60;
        chest.castShadow = true;
        chest.receiveShadow = true;
        this.mesh.add(chest);
        var geomHead = new THREE.BoxGeometry(40, 55, 50, 1, 1, 1);
        this.head = new THREE.Mesh(geomHead, redFurMat);
        this.head.position.set(80, 35, 0);
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        var geomSnout = new THREE.BoxGeometry(40, 30, 30, 1, 1, 1);
        var snout = new THREE.Mesh(geomSnout, redFurMat);
        geomSnout.vertices[0].y -= 5;
        geomSnout.vertices[0].z += 5;
        geomSnout.vertices[1].y -= 5;
        geomSnout.vertices[1].z -= 5;
        geomSnout.vertices[2].y += 5;
        geomSnout.vertices[2].z += 5;
        geomSnout.vertices[3].y += 5;
        geomSnout.vertices[3].z -= 5;
        snout.castShadow = true;
        snout.receiveShadow = true;
        snout.position.set(30, 0, 0);
        this.head.add(snout);
        var geomNose = new THREE.BoxGeometry(10, 15, 20, 1, 1, 1);
        var matNose = new THREE.MeshPhongMaterial({color: Colors.brown, shading: THREE.FlatShading});
        var nose = new THREE.Mesh(geomNose, matNose);
        nose.position.set(55, 0, 0);
        this.head.add(nose);
        var geomEar = new THREE.BoxGeometry(10, 40, 30, 1, 1, 1);
        var earL = new THREE.Mesh(geomEar, redFurMat);
        earL.position.set(-10, 40, -18);
        this.head.add(earL);
        earL.rotation.x = -Math.PI / 10;
        geomEar.vertices[1].z += 5;
        geomEar.vertices[4].z += 5;
        geomEar.vertices[0].z -= 5;
        geomEar.vertices[5].z -= 5;
        var geomEarTipL = new THREE.BoxGeometry(10, 10, 20, 1, 1, 1);
        var matEarTip = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var earTipL = new THREE.Mesh(geomEarTipL, matEarTip);
        earTipL.position.set(0, 25, 0);
        earL.add(earTipL);
        var earR = earL.clone();
        earR.position.z = -earL.position.z;
        earR.rotation.x = -earL.rotation.x;
        this.head.add(earR);
        this.mesh.add(this.head);
        var geomTail = new THREE.BoxGeometry(80, 40, 40, 2, 1, 1);
        geomTail.vertices[4].y -= 10;
        geomTail.vertices[4].z += 10;
        geomTail.vertices[5].y -= 10;
        geomTail.vertices[5].z -= 10;
        geomTail.vertices[6].y += 10;
        geomTail.vertices[6].z += 10;
        geomTail.vertices[7].y += 10;
        geomTail.vertices[7].z -= 10;
        this.tail = new THREE.Mesh(geomTail, redFurMat);
        this.tail.castShadow = true;
        this.tail.receiveShadow = true;
        var geomTailTip = new THREE.BoxGeometry(20, 40, 40, 1, 1, 1);
        var matTailTip = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var tailTip = new THREE.Mesh(geomTailTip, matTailTip);
        tailTip.position.set(80, 0, 0);
        tailTip.castShadow = true;
        tailTip.receiveShadow = true;
        this.tail.add(tailTip);
        this.tail.position.set(-40, 10, 0);
        geomTail.translate(40, 0, 0);
        geomTailTip.translate(10, 0, 0);
        this.tail.rotation.z = Math.PI / 1.5;
        this.mesh.add(this.tail);
        var geomLeg = new THREE.BoxGeometry(20, 60, 20, 1, 1, 1);
        this.legFR = new THREE.Mesh(geomLeg, redFurMat);
        this.legFR.castShadow = true;
        this.legFR.receiveShadow = true;
        var geomFeet = new THREE.BoxGeometry(20, 20, 20, 1, 1, 1);
        var matFeet = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var feet = new THREE.Mesh(geomFeet, matFeet);
        feet.position.set(0, 0, 0);
        feet.castShadow = true;
        feet.receiveShadow = true;
        this.legFR.add(feet);
        this.legFR.position.set(70, -12, 25);
        geomLeg.translate(0, 40, 0);
        geomFeet.translate(0, 80, 0);
        this.legFR.rotation.z = 16;
        this.mesh.add(this.legFR);
        this.legFL = this.legFR.clone();
        this.legFL.position.z = -this.legFR.position.z;
        this.legFL.rotation.z = -this.legFR.rotation.z;
        this.mesh.add(this.legFL);
        this.legBR = this.legFR.clone();
        this.legBR.position.x = -(this.legFR.position.x) + 50;
        this.legBR.rotation.z = -this.legFR.rotation.z;
        this.mesh.add(this.legBR);
        this.legBL = this.legFL.clone();
        this.legBL.position.x = -(this.legFL.position.x) + 50;
        this.legBL.rotation.z = -this.legFL.rotation.z;
        this.mesh.add(this.legBL)
    };
    var sky;
    var forest;
    var land;
    var orbit;
    var airplane;
    var sun;
    var fox;
    var mousePos = {x: 0, y: 0};
    var offSet = -600;

    function createSky() {
        sky = new Sky();
        sky.mesh.position.y = offSet;
        scene.add(sky.mesh)
    }

    function createLand() {
        land = new Land();
        land.mesh.position.y = offSet;
        scene.add(land.mesh)
    }

    function createOrbit() {
        orbit = new Orbit();
        orbit.mesh.position.y = offSet;
        orbit.mesh.rotation.z = -Math.PI / 6;
        scene.add(orbit.mesh)
    }

    function createForest() {
        forest = new Forest();
        forest.mesh.position.y = offSet;
        scene.add(forest.mesh)
    }

    function createSun() {
        sun = new Sun();
        sun.mesh.scale.set(1, 1, .3);
        sun.mesh.position.set(0, -30, -850);
        scene.add(sun.mesh)
    }

    function createPlane() {
        airplane = new AirPlane();
        airplane.mesh.scale.set(.35, .35, .35);
        airplane.mesh.position.set(-40, 110, -250);
        scene.add(airplane.mesh)
    }

    function createFox() {
        fox = new Fox();
        fox.mesh.scale.set(.35, .35, .35);
        fox.mesh.position.set(-40, 110, -250);
        scene.add(fox.mesh)
    }

    function updatePlane() {
        var targetY = normalize(mousePos.y, -.75, .75, 50, 190);
        var targetX = normalize(mousePos.x, -.75, .75, -100, -20);
        airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
        airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * 0.1;
        airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
        airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;
        airplane.mesh.rotation.y = (airplane.mesh.position.x - targetX) * 0.0064;
        airplane.propeller.rotation.x += 0.3
    }

    function normalize(v, vmin, vmax, tmin, tmax) {
        var nv = Math.max(Math.min(v, vmax), vmin);
        var dv = vmax - vmin;
        var pc = (nv - vmin) / dv;
        var dt = tmax - tmin;
        var tv = tmin + (pc * dt);
        return tv
    }

    function loop() {
        land.mesh.rotation.z += .005;
        orbit.mesh.rotation.z += .001;
        sky.mesh.rotation.z += .003;
        forest.mesh.rotation.z += .005;
        updatePlane();
        renderer.render(scene, camera);
        requestAnimationFrame(loop)
    }

    function handleMouseMove(event) {
        var tx = -1 + (event.clientX / WIDTH) * 2;
        var ty = 1 - (event.clientY / HEIGHT) * 2;
        mousePos = {x: tx, y: ty}
    }

    function init(event) {
        createScene();
        createLights();
        createPlane();
        createOrbit();
        createSun();
        createLand();
        createForest();
        createSky();
        document.addEventListener('mousemove', handleMouseMove, false);
        loop()
    }


    document.addEventListener('DOMContentLoaded', () => {
        // Initialize with the correct theme colors before Three.js scene is created
        const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateForestThemeColors(initialTheme);

        // Ensure the 'world' element is present before initializing the Three.js scene
        if (document.getElementById('world')) {
            if (typeof init === 'function') {
                init(); // Call the main init function from your flying forest script
            } else {
                console.error('Flying Forest "init" function is not defined.');
            }
        } else {
            console.error('The "#world" element for the Flying Forest is not found in the DOM.');
        }

        // Listen to theme changes from your main.js
        // This uses a MutationObserver to detect when 'data-theme' attribute changes on <html>
        const observer = new MutationObserver(mutationsList => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    updateForestThemeColors(newTheme);
                }
            }
        });
        observer.observe(document.documentElement, { attributes: true });
    });
