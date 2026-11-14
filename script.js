(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // Keep the 3D character as the same asset, but choreograph its stage across the page.
  function initModel() {
    var host = $("#hero-model");
    if (!host || !window.THREE) return;
    var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.set(0, 0, 7);
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15; host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 1.2));
    var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 4, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(0x2563eb, .65); rim.position.set(-4, 2, -3); scene.add(rim);
    var pivot = new THREE.Group(), motion = { x: 0, y: 0 }, headMotion = { yaw: 0, pitch: 0 }, headShaders = []; scene.add(pivot);
    function prepareMaterial(material) {
      material.onBeforeCompile = function (shader) {
        shader.uniforms.headYaw = { value: headMotion.yaw };
        shader.uniforms.headPitch = { value: headMotion.pitch };
        headShaders.push(shader);
        shader.vertexShader = "uniform float headYaw;\nuniform float headPitch;\n" + shader.vertexShader
          .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n" +
            "float headWeight = smoothstep(6881.0, 8683.0, position.y);\n" +
            "float headCosY = cos(headYaw * headWeight);\nfloat headSinY = sin(headYaw * headWeight);\n" +
            "float headCosX = cos(headPitch * headWeight);\nfloat headSinX = sin(headPitch * headWeight);\n" +
            "mat3 headRotation = mat3(headCosY, 0.0, -headSinY, 0.0, 1.0, 0.0, headSinY, 0.0, headCosY) * mat3(1.0, 0.0, 0.0, 0.0, headCosX, headSinX, 0.0, -headSinX, headCosX);\n" +
            "objectNormal = headRotation * objectNormal;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\n" +
            "vec3 neckPivot = vec3(4495.0, 8028.0, 4420.0);\n" +
            "transformed = neckPivot + headRotation * (transformed - neckPivot);");
      };
      material.needsUpdate = true;
    }
    new THREE.GLTFLoader().load("model.glb", function (gltf) {
      var model = gltf.scene, box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      var scale = 2.6 / Math.max(size.x, size.y, size.z); model.scale.setScalar(scale); model.position.sub(center.multiplyScalar(scale));
      model.traverse(function (object) {
        if (!object.isMesh) return;
        if (Array.isArray(object.material)) object.material.forEach(prepareMaterial);
        else prepareMaterial(object.material);
      });
      pivot.add(model);
    }, undefined, function (err) { console.error("Could not load model:", err); });
    function resize() { var w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    resize(); window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      motion.x = (e.clientX / innerWidth * 2 - 1) * .28;
      motion.y = (e.clientY / innerHeight * 2 - 1) * .16;
    });
    function tick(t) {
      requestAnimationFrame(tick);
      headMotion.yaw += (motion.x * .95 - headMotion.yaw) * .2;
      headMotion.pitch += (motion.y * .55 - headMotion.pitch) * .2;
      headShaders.forEach(function (shader) { shader.uniforms.headYaw.value = headMotion.yaw; shader.uniforms.headPitch.value = headMotion.pitch; });
      pivot.position.y = reduce ? -.12 : -.12 + Math.sin(t / 1300) * .025;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
    if (window.gsap && window.ScrollTrigger && !reduce) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(pivot.position, { x: -.12, scrollTrigger: { trigger: "#projects", start: "top bottom", end: "bottom top", scrub: 1 } });
      gsap.to(pivot.position, { x: .12, scrollTrigger: { trigger: "#skills", start: "top bottom", end: "bottom top", scrub: 1 } });
    }
  }
  function initInteractions() {
    var cursor = $("#cursor");
    if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      window.addEventListener("mousemove", function (e) { cursor.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0) translate(-50%,-50%)"; });
      $$("[data-cursor]").forEach(function (el) { el.addEventListener("mouseenter", function () { cursor.classList.add("active"); cursor.querySelector("span").textContent = el.dataset.cursor; }); el.addEventListener("mouseleave", function () { cursor.classList.remove("active"); }); });
    }
    $$(".tilt-card").forEach(function (card) { card.addEventListener("pointermove", function (e) { var r = card.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5; card.style.transform = "perspective(900px) rotateY(" + x*4 + "deg) rotateX(" + -y*4 + "deg) translateY(-4px)"; }); card.addEventListener("pointerleave", function () { card.style.transform = ""; }); });
    $$(".quick-chips button").forEach(function (button) { button.addEventListener("click", function () { var out = $("#command-output"), text = button.dataset.answer, i = 0; out.textContent = ""; var timer = setInterval(function () { out.textContent += text[i++] || ""; if (i > text.length) clearInterval(timer); }, reduce ? 0 : 13); }); });
    var mb = $("#mb"), navList = $("#ul"); mb.addEventListener("click", function () { var open = navList.classList.toggle("open"); mb.setAttribute("aria-expanded", open); }); $$("#ul a").forEach(function (a) { a.addEventListener("click", function () { navList.classList.remove("open"); }); });
    var last = 0; window.addEventListener("scroll", function () { var y = scrollY, total = document.documentElement.scrollHeight - innerHeight; $("#pr").style.width = (total ? y / total * 100 : 0) + "%"; $(".nav").classList.toggle("hide", y > last && y > 180); last = y; });
    $$(".skill-filters button").forEach(function (button) { button.addEventListener("click", function () { $$(".skill-filters button").forEach(function (b) { b.classList.remove("active"); }); button.classList.add("active"); var filter = button.dataset.filter; $$(".bento-card").forEach(function (card) { card.style.opacity = filter === "all" || card.dataset.category === filter ? "1" : ".24"; }); }); });
    $("#copy-email").addEventListener("click", function () {
      var email = "riteshkadian4@gmail.com";
      var copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(email) : Promise.resolve(document.execCommand("copy"));
      copied.then(function () { $("#toast").classList.add("show"); setTimeout(function () { $("#toast").classList.remove("show"); }, 2200); }).catch(function () { window.location.href = "mailto:" + email; });
    });
    $("#back-top").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
    var time = $("#local-time"); function updateTime() { time.textContent = "LOCAL TIME / " + new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()) + " EST"; } updateTime(); setInterval(updateTime, 1000);
    var gallery = $("#gv"), galleryScroller = $("#gs"), screenshots = { 1: ["images/s1.png","images/s2.png","images/s3.png","images/s4.png","images/s5.png","images/s6.png"], 2: ["images/a1.png","images/a2.png","images/a3.png"] };
    galleryScroller.addEventListener("wheel", function (e) { if (e.deltaY || e.deltaX) { e.preventDefault(); galleryScroller.scrollLeft += e.deltaY + e.deltaX; } }, { passive: false });
    $$(".gallery-trigger").forEach(function (button) { button.addEventListener("click", function () { var i = button.dataset.i; $("#gt").textContent = (i === "1" ? "SkillVector" : "Aura-Dental") + " — Screenshots"; galleryScroller.innerHTML = screenshots[i].map(function (src) { return "<figure><img src=\"" + src + "\" alt=\"Project screenshot\"></figure>"; }).join(""); gallery.classList.add("open"); document.body.style.overflow = "hidden"; }); }); $("#gx").addEventListener("click", function () { gallery.classList.remove("open"); document.body.style.overflow = ""; }); window.addEventListener("keydown", function (e) { if (e.key === "Escape") { gallery.classList.remove("open"); document.body.style.overflow = ""; } });
  }
  function initScroll() { if (window.Lenis && !reduce) { var lenis = new Lenis({ duration: .15, smoothWheel: true, wheelMultiplier: 1.35 }); function raf(t) { lenis.raf(t); requestAnimationFrame(raf); } requestAnimationFrame(raf); } }
  initModel(); initInteractions(); initScroll();
})();
