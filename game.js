kaboom({
    canvas: document.getElementById("game"),
    width: 1920,
    height: 1080,
    background: [0, 0, 0],
});

let touchMoveDir = { p1: vec2(0,0), p2: vec2(0,0) };

// ---------------------------------------------------------
// Assety
// ---------------------------------------------------------
loadSprite("player1", "assets/postava1.png", {
    sliceX: 4, sliceY: 4,
    anims: {
        walk_down:  { from: 0, to: 3, loop: true, speed: 8 },
        walk_left:  { from: 4, to: 7, loop: true, speed: 8 },
        walk_right: { from: 8, to: 11, loop: true, speed: 8 },
        walk_up:    { from: 12, to: 15, loop: true, speed: 8 },
    },
});

loadSprite("player2", "assets/postava2.png", {
    sliceX: 4, sliceY: 4,
    anims: {
        walk_down:  { from: 0, to: 3, loop: true, speed: 8 },
        walk_left:  { from: 4, to: 7, loop: true, speed: 8 },
        walk_right: { from: 8, to: 11, loop: true, speed: 8 },
        walk_up:    { from: 12, to: 15, loop: true, speed: 8 },
    },
});

loadSprite("cat", "assets/kocka.png", {
    sliceX: 4, sliceY: 4,
    anims: {
        walk_down:  { from: 0, to: 3, loop: true, speed: 8 },
        walk_left:  { from: 4, to: 7, loop: true, speed: 8 },
        walk_right: { from: 8, to: 11, loop: true, speed: 8 },
        walk_up:    { from: 12, to: 15, loop: true, speed: 8 },
    },
});

loadSprite("rabbit", "assets/kralik.png", {
    sliceX: 4, sliceY: 4,
    anims: {
        walk_down:  { from: 0, to: 3, loop: true, speed: 8 },
        walk_left:  { from: 4, to: 7, loop: true, speed: 8 },
        walk_right: { from: 8, to: 11, loop: true, speed: 8 },
        walk_up:    { from: 12, to: 15, loop: true, speed: 8 },
    },
});

loadSprite("trava", "assets/trava.png", { sliceX: 3 }); // OPRAVENO - přidáno sliceX
loadSprite("rock", "assets/kamen.png");
loadSprite("tree", "assets/strom.png");
loadSprite("smoke", "assets/smoke.png");
loadSprite("vitez1", "assets/vitez1.png");
loadSprite("vitez2", "assets/vitez2.png");
loadSprite("vitez3", "assets/vitez3.png");
loadSprite("parez", "assets/parez.png");
loadSprite("klavesy", "assets/klavesy.png");
loadSprite("tlacitko_nova_hra", "assets/tlacitko.png");


loadSprite("star", "assets/houba.png", { 
    sliceX: 3,
    anims: {
        "grow": { from: 0, to: 2, loop: false, speed: 1.5 } // Roste postupně od 0 do 2
    }
});

loadSound("firework", "assets/ohnostroj.wav");
loadSound("pickup", "assets/pickup.wav");
loadSound("explosion", "assets/explosion.wav");
loadSound("catSound", "assets/mnouk.wav");
loadSound("crunch", "assets/crunch.wav");


// ---------------------------------------------------------
// Pomocné funkce
// ---------------------------------------------------------
function clampToWindow(e, r = 28) {
    if (e.pos.x < r) e.pos.x = r;
    if (e.pos.x > width() - r) e.pos.x = width() - r;
    if (e.pos.y < r) e.pos.y = r;
    if (e.pos.y > height() - r) e.pos.y = height() - r;
}

function addShadow(parent) {
    return add([
        rect(28, 10, { radius: 5 }), // Trochu větší ovál
        pos(parent.pos.x, parent.pos.y + 16), // Posunuto o 16px dolů pod střed
        color(0, 0, 0),
        opacity(0.4), // Trochu tmavší
        anchor("center"),
        z(-5), // Musí být víc než tráva (-10), ale míň než postavy (5+)
        {
            update() {
                this.pos.x = parent.pos.x;
                this.pos.y = parent.pos.y + 16;
                this.opacity = parent.opacity * 0.4;
            }
        }
    ]);
}
 
function resolvePlayerCollision(p1, p2) {
    const d = p1.pos.dist(p2.pos);
    const minDist = 32; // Minimální vzdálenost, aby se neprolínali

    if (d < minDist && d > 0) {
        // Vypočítáme směr odtlačení
        const u = p1.pos.sub(p2.pos).unit();
        // Vypočítáme, o kolik se překrývají
        const overlap = minDist - d;

        // Každého posuneme o polovinu překryvu (0.5) opačným směrem
        p1.pos = p1.pos.add(u.scale(overlap * 0.5));
        p2.pos = p2.pos.sub(u.scale(overlap * 0.5));
    }
}

function resolveCatPlayerCollision(cat, p) {
    const d = cat.pos.dist(p.pos);
    if (d < 54 && d > 0) {
        const u = cat.pos.sub(p.pos).unit();
        cat.pos = p.pos.add(u.scale(54));
    }
}

function smokeExplosion(x, y) {
    for (let i = 0; i < 40; i++) {
        // Nejprve vytvoříme částici
        const p = add([
            sprite("smoke"),
            pos(x, y),
            scale(rand(0.5, 1.5)),
            opacity(1),
            anchor("center"),
            z(10),
            {
                vx: rand(-120, 120),
                vy: rand(-120, 120),
                life: rand(0.4, 1.0),
            },
        ]);

        // A pohyb jí přiřadíme samostatně
        p.onUpdate(() => {
            p.move(p.vx, p.vy);
            p.opacity -= dt() / p.life;
            if (p.opacity <= 0) p.destroy();
        });
    }
}

function fireworkExplosion(x, y) {
    for (let i = 0; i < 80; i++) {
        const speed = rand(100, 400); // TADY JE RYCHLOST 
        const angle = rand(0, 360);   // Náhodný směr do všech stran
        
        const p = add([
            sprite("smoke"),
            pos(x, y),
            scale(rand(0.8, 2.5)),
            color(rand(100, 255), rand(100, 255), rand(100, 255)),
            opacity(1),
            anchor("center"),
            z(3),
            {
                // Přepočet rychlosti a úhlu na posun v osách
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: rand(2.0, 3.5),
            },
        ]);

        p.onUpdate(() => {
            p.vy += 300 * dt(); // Gravitace (tahá to dolů)
            p.move(p.vx, p.vy);
            
            p.opacity -= dt() / p.life;
            if (p.opacity <= 0) p.destroy();
        });
    }
}

// ---------------------------------------------------------
// Scéna spusť
// ---------------------------------------------------------
scene("start", () => {
    add([
        rect(width(), height()),
        color(0, 0, 0)
    ]);

    add([
        // 1. Text nadpis
        text("Pipi, Adolf a houby\n\n\n", { size: 48, font: "sans-serif" }),
        pos(width() / 2, height() / 2 - 100), // Posunul jsem výš, aby se tam vešel obrázek
        anchor("center"),
        color(255, 200, 0)
    ]);

    add([
        // 2. Samostatný objekt pro obrázek klávesnice
        sprite("klavesy"), // Používáme "sprite", nikoliv "img"
        pos(width() / 2, height() / 2),
        anchor("center"),
        scale(0.8) // Podle potřeby uprav velikost
    ]);

    add([
        // 3. Text pod obrázkem
        text("Na dotykové obrazovce dej prst na hráče",
        { size: 24, font: "sans-serif" }),
        pos(width() / 2, height() / 2 + 100),
        anchor("center")
    ]);
    
    add([
        // 4. Text pod obrázkem
        text("Seber co nejvíc hub. Pozor na jejich výbuch!",
        { size: 24, font: "sans-serif" }),
        pos(width() / 2, height() / 2 + 150),
        anchor("center")
    ]);
       
    add([
        // 5. Další text pod obrázkem
        text("\nKlikni pro start", 
        { size: 24, font: "sans-serif" }),
        pos(width() / 2, height() / 2 + 200),
        anchor("center")
    ]); 
    // Funkce pro spuštění hry
    function begin() {
        play("pickup", { volume: 0 }); 
        go("game");
    }

    // Kombinované ovládání pro start
    onMousePress(begin);
    onKeyPress(begin);
    onClick(begin); // Toto v Kaboom často funguje pro obojí (myš i dotyk)
    onTouchStart(begin);
});


// ---------------------------------------------------------
// Scéna hry
// ---------------------------------------------------------

    scene("game", () => {

      // --- DOKONALÉ DOTYKOVÉ OVLÁDÁNÍ PRO 2 HRÁČE ---
      let touchesNow = {};
      let fingerP1 = null;
      let fingerP2 = null;
      let touchStartP1 = null;
      let touchStartP2 = null;
      let lastTouchP1 = null;
      let lastTouchP2 = null;

      function toCanvasPos(screenPos) {
          // BEZPEČNOSTNÍ KONTROLA: Pokud Kaboom předá prázdnou pozici, vrátíme nulový vektor
          if (!screenPos) return vec2(0, 0);

          const canvas = document.getElementById("game");
          const rect = canvas.getBoundingClientRect();
          
          // Výpočet černých okrajů (letterboxu) z CSS object-fit: contain
          const gameRatio = 800 / 600;
          let actualWidth = rect.width;
          let actualHeight = rect.height;
          let offsetX = 0;
          let offsetY = 0;

          if (rect.width / rect.height > gameRatio) {
              actualWidth = rect.height * gameRatio;
              offsetX = (rect.width - actualWidth) / 2;
          } else {
              actualHeight = rect.width / gameRatio;
              offsetY = (rect.height - actualHeight) / 2;
          }

          const scaleX = 800 / actualWidth;
          const scaleY = 600 / actualHeight;

          // KLÍČOVÁ OPRAVA PRO MULTITOUCH: Spolehlivě vytáhneme X a Y z jakéhokoliv typu doteku
          const clientX = screenPos.x !== undefined ? screenPos.x : (screenPos.clientX || 0);
          const clientY = screenPos.y !== undefined ? screenPos.y : (screenPos.clientY || 0);

          return vec2(
              (clientX - rect.left - offsetX) * scaleX,
              (clientY - rect.top - offsetY) * scaleY
          );
      } 
      onTouchStart((pos, t) => {
          const p = toCanvasPos(pos);
          touchesNow[t.identifier] = p;

          const GRAB_RADIUS = 32; // Zvětšeno pro pohodlnější chycení
          const dist1 = p.dist(player1.pos);
          const dist2 = p.dist(player2.pos);

          // Priorita pro Hráče 1
          if (fingerP1 === null && dist1 < GRAB_RADIUS) {
              fingerP1 = t.identifier;
          } 
          // Pokud prst nechytil Hráče 1, zkusíme Hráče 2
          else if (fingerP2 === null && dist2 < GRAB_RADIUS) {
              fingerP2 = t.identifier;
          }
      });
  
      onTouchMove((pos, t) => {
          touchesNow[t.identifier] = toCanvasPos(pos); 
      });

      onTouchEnd((pos, t) => {
          delete touchesNow[t.identifier];

          if (t.identifier === fingerP1) {
              fingerP1 = null;
              touchMoveDir.p1 = vec2(0, 0);
          }
          if (t.identifier === fingerP2) {
              fingerP2 = null;
              touchMoveDir.p2 = vec2(0, 0);
          }
      });
                                                
           // Pozadí s náhodnou trávou
          for (let y = 0; y < 34; y++) {
              for (let x = 0; x < 60; x++) {
                  add([
                      sprite("trava", { frame: randi(0, 3) }), // Vybere náhodný obrázek trávy
                      pos(x * 32, y * 32),
                      z(-10),
                  ]);
              }
          }
                                                          
          // Pozadí s náhodnou trávou
          for (let y = 0; y < 19; y++) {
              for (let x = 0; x < 25; x++) {
                  add([
                      sprite("trava", { frame: randi(0, 3) }), // Vybere náhodný obrázek trávy
                      pos(x * 32, y * 32),
                      z(-10),
                  ]);
              }
          }

    const obstacles = [];

    const createObstacle = (type) => {

        // 1) Náhodná pozice v rámci aktuálního canvasu
        let position = vec2(
            rand(64, width() - 64),
            rand(64, height() - 64)
        );

        // 2) Dynamická zakázaná zóna uprostřed (200×200)
        const midX = width() / 2;
        const midY = height() / 2;

        while (
            position.x > midX - 100 &&
            position.x < midX + 100 &&
            position.y > midY - 100 &&
            position.y < midY + 100
        ) {
            position = vec2(
                rand(64, width() - 64),
                rand(64, height() - 64)
            );
        }

        // 3) Vytvoření překážky
        const obj = add([
            sprite(type),
            pos(position),
            area(),
            anchor("center"),
            z(position.y),   // správné překrývání podle Y
            type,            // "tree" nebo "rock"
            "obstacle",      // společný tag
        ]);

        obstacles.push(obj);
    };

    for (let i = 0; i < 10; i++) { createObstacle("rock"); createObstacle("tree"); }

    function collideWithObstacles(e) {
        for (const o of obstacles) {
            const d = e.pos.dist(o.pos);
            if (d < 50 && d > 0) {
                const u = e.pos.sub(o.pos).unit();
                e.pos = o.pos.add(u.scale(50));
            }
        }
    }

    const player1 = add([
        sprite("player1"),
        pos(width() / 2 + 15, height() / 2),
        area({ collision: false }),
        anchor("center"),
        z(5),
        { speed: 180, score: 0 },
        {
            draw() {
                drawEllipse({
                    pos: vec2(0, 30),
                    radiusX: 14,
                    radiusY: 6,
                    color: Color.fromHex("#000000"),
                    opacity: 0.3,
                });
            }
        }
    ]);

    // PLAYER 2 – dynamický střed obrazovky
    const player2 = add([
        sprite("player2"),
        pos(width() / 2 - 15, height() / 2),   // vedle player1
        area({ collision: false }),
        anchor("center"),
        z(5),
        { speed: 180, score: 0 },
        {
            draw() {
                drawEllipse({
                    pos: vec2(0, 30),
                    radiusX: 14,
                    radiusY: 6,
                    color: Color.fromHex("#000000"),
                    opacity: 0.3,
                });
            }
        }
    ]);

    // KOČKA – dynamický spawn kdekoliv v mapě
    const cat = add([
        sprite("cat"),
        pos(
            rand(100, width() - 100),
            rand(100, height() - 100)
        ),
        area(),
        anchor("center"),
        z(5),
        { speed: 210 },
        {
            draw() {
                drawEllipse({
                    pos: vec2(0, 15),
                    radiusX: 12,
                    radiusY: 4,
                    color: Color.fromHex("#000000"),
                    opacity: 0.3,
                });
            }
        }
    ]);

    // KRÁLÍK – dynamický spawn kdekoliv v mapě
    const rabbit = add([
        sprite("rabbit"),
        pos(
            rand(100, width() - 100),
            rand(100, height() - 100)
        ),
        area({ shape: new Rect(vec2(0), 16, 16) }),
        anchor("center"),
        z(5),
        {
            dir: vec2(0, 0),
            timer: 0,
            stuckTimer: 0,
            state: "idle",
        },
    ]);
          
    function spawnStar() {

        // 1) Náhodná pozice v rámci aktuálního canvasu
        let position = vec2(
            rand(50, width() - 50),
            rand(50, height() - 50)
        );

        // 2) Vyhnout se překážkám – dynamicky
        for (let i = 0; i < 20; i++) {
            let collision = false;

            for (const o of obstacles) {
                if (position.dist(o.pos) < 60) {
                    collision = true;
                    break;
                }
            }

            if (!collision) break;

            // Nová dynamická pozice
            position = vec2(
                rand(50, width() - 50),
                rand(50, height() - 50)
            );
        }

        // 3) Vytvoření houby
        const s = add([
            sprite("star", { anim: "grow" }),
            pos(position),
            area({ shape: new Rect(vec2(0), 10, 10) }),
            anchor("center"),
            z(6),
            "star",
        ]);

        // 4) Po dokončení animace růstu houba sama vybuchne
        s.onAnimEnd((anim) => {
            if (anim === "grow") {
                explodeStar(s, true);
            }
        });

        return s;
    }
    
    let star = spawnStar();

    function explodeStar(s, showVisuals = true) {
        if (!s || !s.exists()) return;

        const p = s.pos.clone();

        if (showVisuals) {

            // ČERVENÉ ČÁSTICE
            for (let i = 0; i < 80; i++) {
                const particle = add([
                    sprite("smoke"),
                    pos(p.x, p.y),
                    scale(rand(1.5, 3)),
                    color(255, rand(0, 100), 0),
                    opacity(1),
                    anchor("center"),
                    z(15),
                    {
                        vx: rand(-300, 300),
                        vy: rand(-300, 300),
                        life: rand(0.6, 1.5),
                    },
                ]);

                particle.onUpdate(() => {
                    particle.move(particle.vx, particle.vy);
                    particle.opacity -= dt() / particle.life;
                    if (particle.opacity <= 0) particle.destroy();
                });
            }

            play("explosion");

            // Odečtení bodů hráčům v dosahu
            const range = 150;

            if (player1.pos.dist(p) < range) {
                player1.score = Math.max(0, player1.score - 2);
                score1Text.text = "Jakub: " + player1.score;
            }

            if (player2.pos.dist(p) < range) {
                player2.score = Math.max(0, player2.score - 2);
                score2Text.text = "Eliška: " + player2.score;
            }
        }

        destroy(s);
        star = null;

        // Dynamický respawn houby
        wait(2, () => {
            if (!star) star = spawnStar();
        });
    }
             
    // SCORE TEXTY – dynamické pozice
    const score1Text = add([
        text("Jakub: 0", { size: 18, font: "sans-serif" }),
        pos(20, 20),
        z(1000)
    ]);

    const score2Text = add([
        text("Eliška: 0", { size: 18, font: "sans-serif" }),
        pos(20, 50),
        z(1000)
    ]);

    // ČAS – dynamicky vpravo nahoře
    const timeText = add([
        text("čas: 3:00", { size: 18, font: "sans-serif" }),
        pos(width() - 120, 20),   // místo pevného 680
        z(1000)
    ]);

    let gameTime = 180;


    // ---------------------------------------------------------
    // FUNKCE handlePlayer
    // ---------------------------------------------------------
    function handlePlayer(p, keys, tDir = vec2(0,0)) { // tDir je směr z dotyku
        let moveDir = vec2(0, 0);

        // KLÁVESNICE
        if (isKeyDown(keys.left))  moveDir.x -= 1;
        if (isKeyDown(keys.right)) moveDir.x += 1;
        if (isKeyDown(keys.up))    moveDir.y -= 1;
        if (isKeyDown(keys.down))  moveDir.y += 1;

        // DOTYK (použije se, jen když se nemačkají klávesy)
        if (moveDir.x === 0 && moveDir.y === 0 && tDir.len() !== 0) {
            moveDir = tDir;
        }

        if (moveDir.x !== 0 || moveDir.y !== 0) {
            p.move(moveDir.unit().scale(p.speed));

            let anim = "";
            if (Math.abs(moveDir.x) >= Math.abs(moveDir.y)) {
                anim = moveDir.x > 0 ? "walk_right" : "walk_left";
            } else {
                anim = moveDir.y > 0 ? "walk_down" : "walk_up";
            }
            if (p.curAnim() !== anim) p.play(anim);
        } else {
            if (p.curAnim()) {
                const last = p.curAnim();
                p.stop();
                if (last === "walk_down")  p.frame = 0;
                if (last === "walk_left")  p.frame = 4;
                if (last === "walk_right") p.frame = 8;
                if (last === "walk_up")    p.frame = 12;
            }
        }
    }

        onUpdate(() => {
            // Reset směru pro animace na začátku každého snímku
            touchMoveDir.p1 = vec2(0, 0);
            touchMoveDir.p2 = vec2(0, 0);

            // Hráč 1 - Jakub
            if (fingerP1 !== null) {
                const p = touchesNow[fingerP1];
                if (p) {
                    const dist = p.dist(player1.pos);
                    if (dist > 10) { // Pokud je prst dál než 10px, panáček běží
                        const dir = p.sub(player1.pos).unit();
                        touchMoveDir.p1 = dir; // Předáme směr pro animaci
                    }
                }
            }

            // Hráč 2 - Eliška
            if (fingerP2 !== null) {
                const p = touchesNow[fingerP2];
                if (p) {
                    const dist = p.dist(player2.pos);
                    if (dist > 10) {
                        const dir = p.sub(player2.pos).unit();
                        touchMoveDir.p2 = dir;
                    }
                }
            }

            // Volání animací (handlePlayer) - nechej tak, jak máš, 
            // jen se ujisti, že v handlePlayer nemáš to player.speed = 0!
 
        // Aplikace směru na hráče
        handlePlayer(
            player1,
            { left: "left", right: "right", up: "up", down: "down" },
            touchMoveDir.p1
        );

        handlePlayer(
            player2,
            { left: "a", right: "d", up: "w", down: "s" },
            touchMoveDir.p2
        );

        
        // Dynamické nastavení z-indexu podle pozice Y
        player1.z = player1.pos.y;
        player2.z = player2.pos.y;
        cat.z = cat.pos.y;
        obstacles.forEach(o => o.z = o.pos.y);  // i pro překrývání kamenů a stromů

        if (star && star.exists()) {
            // 1. POHYB KE HOUBĚ
            const dir = star.pos.sub(cat.pos).unit();
            cat.move(dir.scale(cat.speed));

            // 2. ANIMACE CHŮZE
            let catAnim = Math.abs(dir.x) > Math.abs(dir.y) 
                ? (dir.x > 0 ? "walk_right" : "walk_left") 
                : (dir.y > 0 ? "walk_down" : "walk_up");
            
            if (cat.curAnim() !== catAnim) cat.play(catAnim);
        } else {
            // 3. ZASTAVENÍ, KDYŽ HOUBA NENÍ
            if (cat.curAnim()) {
                const last = cat.curAnim();
                cat.stop();
                // Nastavení klidového snímku podle posledního směru
                if (last === "walk_down")  cat.frame = 0;
                if (last === "walk_left")  cat.frame = 4;
                if (last === "walk_right") cat.frame = 8;
                if (last === "walk_up")    cat.frame = 12;
            }
        }

        // Kolize
        const collide = (e1, e2, dist) => {
            const d = e1.pos.dist(e2.pos);
            if (d < dist && d > 0) {
                const u = e1.pos.sub(e2.pos).unit();
                e1.pos = e2.pos.add(u.scale(dist));
            }
        };

        for(const o of obstacles) { collide(player1, o, 50); collide(player2, o, 50); collide(cat, o, 50); }
 
        // Opravená kolize hráčů - férové odtlačení bez lepení
        const d_p = player1.pos.dist(player2.pos);
        const MIN_DIST = 34; // Trochu víc než 32 pro jistotu

        if (d_p < MIN_DIST) {
            let u = player1.pos.sub(player2.pos);
            
            // Pokud stojí úplně na sobě, vytvoříme náhodný směr
            if (u.isZero()) u = vec2(rand(-1, 1), rand(-1, 1));
            
            const dir = u.unit();
            const overlap = MIN_DIST - d_p;
            
            // Rozestoupí se
            player1.pos = player1.pos.add(dir.scale(overlap * 0.5));
            player2.pos = player2.pos.sub(dir.scale(overlap * 0.5));
        }

        collide(cat, player1, 54); collide(cat, player2, 54);
        
        clampToWindow(player1); clampToWindow(player2); clampToWindow(cat);
        // --- LOGIKA KRÁLÍKA (POHYB A KLID) ---
        if (rabbit.state === "eating") { // TADY BYLO CHYBNĚ !==
            rabbit.stop();
            rabbit.frame = 0; 
        } else {
            rabbit.z = rabbit.pos.y;
            rabbit.timer -= dt();
            
            if (rabbit.timer <= 0) {
                rabbit.timer = rand(1, 3);
                const lastAnim = rabbit.curAnim();

                const isExploring = Math.random() < 0.3;
                const trees = get("tree");
                let nearestTree = null;
                let minDist = 400;

                if (!isExploring && trees.length > 0) {
                    trees.forEach((t) => {
                        const d = rabbit.pos.dist(t.pos);
                        if (d < minDist) { 
                            minDist = d; 
                            nearestTree = t; 
                        }
                    });
                }

                if (nearestTree) {
                    rabbit.dir = nearestTree.pos.sub(rabbit.pos).unit();
                } else {
                    rabbit.dir = choose([vec2(1,0), vec2(-1,0), vec2(0,1), vec2(0,-1), vec2(0,0)]);
                }
                
                if (rabbit.dir.x !== 0 || rabbit.dir.y !== 0) {
                    let anim = "";
                    if (Math.abs(rabbit.dir.x) > Math.abs(rabbit.dir.y)) {
                        anim = rabbit.dir.x > 0 ? "walk_right" : "walk_left";
                    } else {
                        anim = rabbit.dir.y > 0 ? "walk_down" : "walk_up";
                    }
                    if (rabbit.curAnim() !== anim) rabbit.play(anim);
                } else {
                    rabbit.stop();
                    if (lastAnim === "walk_down") rabbit.frame = 0;
                    if (lastAnim === "walk_left") rabbit.frame = 4;
                    if (lastAnim === "walk_right") rabbit.frame = 8;
                    if (lastAnim === "walk_up") rabbit.frame = 12;
                }
            }
            rabbit.move(rabbit.dir.scale(70));
        } // <--- TADY MUSÍ KONČIT VĚTEV ELSE

        // Kolize a hranice (tyto musí být mimo větev else, nebo pod ní)
        collide(rabbit, player1, 32);
        collide(rabbit, player2, 32);
        for(const o of obstacles) { 
            if (o.is("rock") && rabbit.state !== "eating") collide(rabbit, o, 40); 
        }
        clampToWindow(rabbit);

        // Zbytek kódu (časovač a houby) pokračuje tady...
        gameTime -= dt();
        const t = Math.max(0, Math.floor(gameTime));
        timeText.text = `čas: ${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;
        // --- SBĚR HUB ---
        if (star && star.exists()) {
            if (player1.isColliding(star)) {
                player1.score++; 
                score1Text.text = "Jakub: " + player1.score;
                play("pickup"); 
                let s = star; star = null; s.destroy();
                wait(2, () => { if (!star) star = spawnStar(); });
            } else if (player2.isColliding(star)) {
                player2.score++; 
                score2Text.text = "Eliška: " + player2.score;
                play("pickup"); 
                let s = star; star = null; s.destroy();
                wait(2, () => { if (!star) star = spawnStar(); });
            } else if (cat.isColliding(star)) {
                play("catSound");
                explodeStar(star, false);
            }
        }

        if (gameTime <= 0) go("ceremony", { s1: player1.score, s2: player2.score });

        timeText.pos = vec2(width() - 120, 20);
    }); // Konec onUpdate

    rabbit.onCollide("tree", (t) => {
        if (rabbit.state === "eating") return;

        rabbit.state = "eating";
        rabbit.dir = vec2(0, 0);
        rabbit.stop();
        rabbit.opacity = 0; 

        play("crunch", { volume: 0.3 }); 

        wait(12, () => {
            if (t.exists()) {
                // 1. Vytvoříme pařez na místě stromu
                add([
                    sprite("parez"),
                    pos(t.pos),
                    anchor("center"),
                    opacity(0.9),
                    z(4), // Pařez bude mírně pod úrovní, kde byl strom
                    "stump"        // Nový tag, aby byl jen vizuální (není v obstacles)
                ]);

                // 2. Odstraníme strom z pole překážek, aby byl průchozí
                const idx = obstacles.indexOf(t);
                if (idx > -1) obstacles.splice(idx, 1);
                
                // 3. Zničíme původní strom
                destroy(t);
            }
            rabbit.opacity = 1;
            rabbit.state = "idle";
        });
    });
   
}); // Konec scény game
// --- SCÉNA CEREMONY ---
scene("ceremony", ({ s1, s2 }) => {

    // Černé pozadí přes celou plochu
    add([
        rect(width(), height()),
        color(0, 0, 0)
    ]);

    let txt = "";
    let img = "vitez1";

    if (s1 > s2) {
        txt = "Vítěz: Jakub!";
        img = "vitez1";
    } else if (s2 > s1) {
        txt = "Vítězka: Eliška!";
        img = "vitez2";
    } else {
        txt = "Remíza!";
        img = "vitez3";
    }

    // Obrázek vítěze – dynamický střed
    add([
        sprite(img),
        pos(width() / 2, height() / 2),
        anchor("center"),
        z(10)
    ]);

    // Text se skóre – dynamicky nad obrázkem
    add([
        text(`${txt}\nSkóre:\nJakub: ${s1}\nEliška: ${s2}`, {
            size: 32,
            font: "sans-serif",
            align: "center"
        }),
        pos(width() / 2, height() / 2 - 150),
        anchor("center"),
        z(20)
    ]);

    // Proměnná, která určuje, zda už lze hru restartovat
    let canRestart = false;

    // TLAČÍTKO JAKO OBRÁZEK (SPRITE)
    const btn = add([
        sprite("tlacitko_nova_hra"), 
        pos(width() / 2, height() - 80),
        anchor("center"),
        area(), 
        opacity(0), // Na začátku skryté
        z(20)
    ]);
    
    // Časovač na 5 sekund – poté zviditelníme tlačítko a povolíme restart
    wait(5, () => {
        canRestart = true;
        btn.opacity = 1; 
    });
    
    // Společná funkce pro spuštění hry
    function begin() {
        if (!canRestart) return; 
        play("pickup", { volume: 0 }); 
        go("game");
    }

    // IDENTICKÁ FUNKCE PRO PŘEPOČET 
    function toCanvasPos(screenPos) {
        // BEZPEČNOSTNÍ KONTROLA: Pokud Kaboom předá prázdnou pozici, vrátíme nulový vektor
        if (!screenPos) return vec2(0, 0);

        const canvas = document.getElementById("game");
        const rect = canvas.getBoundingClientRect();
        
        // Výpočet černých okrajů (letterboxu) z CSS object-fit: contain
        const gameRatio = 800 / 600;
        let actualWidth = rect.width;
        let actualHeight = rect.height;
        let offsetX = 0;
        let offsetY = 0;

        if (rect.width / rect.height > gameRatio) {
            actualWidth = rect.height * gameRatio;
            offsetX = (rect.width - actualWidth) / 2;
        } else {
            actualHeight = rect.width / gameRatio;
            offsetY = (rect.height - actualHeight) / 2;
        }

        const scaleX = 800 / actualWidth;
        const scaleY = 600 / actualHeight;

        // KLÍČOVÁ OPRAVA PRO MULTITOUCH: Spolehlivě vytáhneme X a Y z jakéhokoliv typu doteku
        const clientX = screenPos.x !== undefined ? screenPos.x : (screenPos.clientX || 0);
        const clientY = screenPos.y !== undefined ? screenPos.y : (screenPos.clientY || 0);

        return vec2(
            (clientX - rect.left - offsetX) * scaleX,
            (clientY - rect.top - offsetY) * scaleY
        );
    }
   
    // IDENTICKÝ DOTYKOVÝ SYSTÉM JAKO U PANÁČKŮ 
    onTouchStart((pos, t) => {
        const p = toCanvasPos(pos); // Přepočet pozice prstu
        
        const GRAB_RADIUS = 100; // Akční rádius dotyku (případně zvětšete podle velikosti obrázku)
        const dist = p.dist(btn.pos); // Vzdálenost prstu od středu tlačítka

        // Pokud prst zasáhl oblast tlačítka, odstartujeme hru
        if (dist < GRAB_RADIUS) {
            begin();
        }
    });

    // DETEKCE PRO KLIK MYŠÍ
    onClick(() => {
        if (btn.hasPoint(mousePos())) {
            begin();
        }
    });
    
    // DETEKCE PRO KLÁVESNICI (Mezerník / Enter)
    onKeyPress(begin);

    // Funkce pro ohňostroj
    function spawnRandomFirework() {
        fireworkExplosion(
            rand(100, width() - 100),
            rand(100, height() / 2)
        );
        play("firework", { volume: 0.2 });

        wait(rand(0.5, 1.5), () => {
            // OPRAVENO: Použití funkční metody .exists() z Kaboom.js
            if (btn.exists()) { 
                spawnRandomFirework();
            }
        });
    }

    spawnRandomFirework();
});

// Spuštění hry
go("start");


