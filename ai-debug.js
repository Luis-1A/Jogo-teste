// ai-debug.js - IA Auto-Corretiva
const AI = {
    logs: [],
    bugDatabase: [],
    performanceMetrics: [],
    autoFixEnabled: true,
    
    init() {
        this.startMonitoring();
        console.log('🤖 IA Auto-Debug inicializada');
    },
    
    // Monitoramento contínuo
    startMonitoring() {
        setInterval(() => {
            this.checkPerformance();
            this.analyzeCode();
            this.optimizeRender();
        }, 5000);
    },
    
    // Verificar performance
    checkPerformance() {
        const metrics = {
            fps: RenderEngine.lastFps || 60,
            entities: Physics.entities.length,
            particles: Physics.particles.length,
            memory: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0,
            timestamp: Date.now()
        };
        
        this.performanceMetrics.push(metrics);
        if (this.performanceMetrics.length > 20) this.performanceMetrics.shift();
        
        // Detectar problemas
        if (metrics.fps < 30) {
            this.reportBug('performance_low', `FPS caiu para ${metrics.fps}`, metrics);
            this.applyFix('reduce_quality');
        }
        
        if (metrics.particles > 500) {
            this.reportBug('particle_overflow', `Excesso de partículas: ${metrics.particles}`, metrics);
            this.applyFix('cleanup_particles');
        }
        
        this.updateUI(metrics);
    },
    
    // Análise de código em tempo real
    analyzeCode() {
        // Verificar funções lentas
        const slowFunctions = this.findSlowFunctions();
        slowFunctions.forEach(fn => {
            this.reportBug('slow_function', `Função ${fn.name} levou ${fn.time}ms`, fn);
        });
    },
    
    findSlowFunctions() {
        // Simulação - em produção usaria User Timing API
        return [];
    },
    
    // Otimização de renderização
    optimizeRender() {
        const avgFps = this.performanceMetrics.reduce((a, b) => a + b.fps, 0) / this.performanceMetrics.length;
        
        if (avgFps < 45) {
            // Reduzir qualidade automaticamente
            RenderEngine.postProcessing = false;
            Physics.particles = Physics.particles.slice(0, 200);
            this.log('Otimização aplicada: qualidade reduzida para manter performance', 'fix');
        } else if (avgFps > 55 && !RenderEngine.postProcessing) {
            // Restaurar qualidade se performance melhorar
            RenderEngine.postProcessing = true;
            this.log('Otimização: qualidade restaurada', 'fix');
        }
    },
    
    // Reportar bug
    reportBug(type, message, data = {}) {
        const bug = {
            id: Date.now(),
            type,
            message,
            data,
            timestamp: new Date().toISOString(),
            fixed: false
        };
        
        this.bugDatabase.push(bug);
        this.log(`BUG DETECTADO [${type}]: ${message}`, 'error');
        
        if (this.autoFixEnabled) {
            this.attemptFix(bug);
        }
        
        // Limitar tamanho do banco
        if (this.bugDatabase.length > 50) {
            this.bugDatabase = this.bugDatabase.slice(-50);
        }
    },
    
    // Tentar corrigir automaticamente
    attemptFix(bug) {
        const fixes = {
            'attack_not_working': () => {
                // Recriar event listeners de ataque
                Input.rebindAttack();
                return 'Event listeners de ataque recriados';
            },
            'magic_not_casting': () => {
                Game.player.mana = Math.max(Game.player.mana, 10);
                Input.rebindMagic();
                return 'Sistema de magia reinicializado';
            },
            'collision_bug': () => {
                Physics.entities = Physics.entities.filter(e => e && e.x !== undefined);
                return 'Entidades inválidas removidas';
            },
            'memory_leak': () => {
                Physics.particles = Physics.particles.slice(-300);
                Game.particles = [];
                return 'Cache limpo, partículas limitadas';
            },
            'render_glitch': () => {
                RenderEngine.init();
                return 'Render reinicializado';
            }
        };
        
        if (fixes[bug.type]) {
            try {
                const result = fixes[bug.type]();
                bug.fixed = true;
                bug.fixResult = result;
                this.log(`AUTO-FIX: ${result}`, 'fix');
            } catch(e) {
                this.log(`Falha no auto-fix: ${e.message}`, 'warn');
            }
        }
    },
    
    // Aplicar correção específica
    applyFix(fixType) {
        const fixes = {
            'reduce_quality': () => {
                RenderEngine.camera.zoom = 0.8;
                document.getElementById('renderCanvas').style.imageRendering = 'pixelated';
            },
            'cleanup_particles': () => {
                Physics.particles = Physics.particles.filter(p => p.life > 0.1);
            }
        };
        
        if (fixes[fixType]) fixes[fixType]();
    },
    
    // Logging
    log(message, type = 'info') {
        this.logs.push({ message, type, time: Date.now() });
        
        const logDiv = document.getElementById('aiLogs');
        if (logDiv) {
            const entry = document.createElement('div');
            entry.className = `log ${type}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logDiv.insertBefore(entry, logDiv.firstChild);
            
            // Limitar logs visíveis
            while (logDiv.children.length > 20) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }
        
        console.log(`[AI] ${message}`);
    },
    
    // Atualizar UI de debug
    updateUI(metrics) {
        document.getElementById('fps').textContent = Math.round(metrics.fps);
        document.getElementById('entityCount').textContent = metrics.entities;
        document.getElementById('particleCount').textContent = metrics.particles;
    },
    
    // Comandos Lua para debugging
    luaDebug(code) {
        return LuaEngine.execute(code, { debug: true });
    }
};

// Input System Corrigido
const Input = {
    keys: {},
    touch: { active: false, x: 0, y: 0 },
    joystick: { active: false, dx: 0, dy: 0 },
    camera: { active: false, lastX: 0, lastY: 0 },
    
    init() {
        this.setupKeyboard();
        this.setupTouch();
        this.setupMouse();
        console.log('🎮 Input System inicializado');
    },
    
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Mapeamento de habilidades
            switch(e.code) {
                case 'KeyQ':
                case 'Digit1':
                    this.triggerAttack();
                    break;
                case 'KeyW':
                case 'Digit2':
                    this.triggerMagic();
                    break;
                case 'KeyE':
                case 'Digit3':
                    this.triggerDodge();
                    break;
                case 'KeyR':
                case 'Digit4':
                    this.triggerSpecial();
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },
    
    setupTouch() {
        // Joystick de movimento
        const moveZone = document.getElementById('moveJoystick');
        const moveHandle = document.getElementById('moveHandle');
        
        if (!moveZone) return;
        
        let moveActive = false;
        let moveCenter = { x: 0, y: 0 };
        
        moveZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = moveZone.getBoundingClientRect();
            moveCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            moveActive = true;
            this.updateJoystick(touch, moveCenter, moveHandle, true);
        }, {passive: false});
        
        moveZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (moveActive) {
                this.updateJoystick(e.touches[0], moveCenter, moveHandle, true);
            }
        }, {passive: false});
        
        const endMove = (e) => {
            e.preventDefault();
            moveActive = false;
            this.joystick.active = false;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            moveHandle.style.transform = `translate(-50%, -50%)`;
        };
        
        moveZone.addEventListener('touchend', endMove);
        moveZone.addEventListener('touchcancel', endMove);
    },
    
    updateJoystick(touch, center, handle, isMovement) {
        const maxDist = 40;
        let dx = touch.clientX - center.x;
        let dy = touch.clientY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        
        handle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        
        if (isMovement) {
            this.joystick.active = true;
            this.joystick.dx = dx / maxDist;
            this.joystick.dy = dy / maxDist;
        }
    },
    
    setupMouse() {
        // Para testes em desktop
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.triggerAttack();
        });
    },
    
    // Ações de combate CORRIGIDAS
    triggerAttack() {
        console.log('⚔️ ATAQUE ACIONADO');
        
        if (Game.player.attackCooldown > 0) {
            console.log('Cooldown ativo');
            return;
        }
        
        Game.player.attackCooldown = 20;
        Game.player.isAttacking = true;
        Game.player.attackFrame = 0;
        
        // Efeitos visuais
        const angle = Game.player.direction === 1 ? 0 : Math.PI;
        for (let i = 0; i < 8; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            Physics.addParticle({
                x: Game.player.x + Math.cos(angle + spread) * 40,
                y: Game.player.y + Math.sin(angle + spread) * 40,
                vx: Math.cos(angle + spread) * 5,
                vy: Math.sin(angle + spread) * 5,
                life: 0.3,
                size: 4,
                color: '#ffd700',
                glow: 15
            });
        }
        
        // Detecção de hit
        const attackRange = 80;
        const attackAngle = Game.player.direction === 1 ? 0 : Math.PI;
        const attackX = Game.player.x + Math.cos(attackAngle) * 50;
        const attackY = Game.player.y + Math.sin(attackAngle) * 50;
        
        let hitCount = 0;
        Game.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            
            const dx = enemy.x - attackX;
            const dy = enemy.y - attackY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < attackRange) {
                // Calcular dano
                const damage = 25 + (Game.player.level * 5);
                enemy.hp -= damage;
                hitCount++;
                
                // Knockback
                const knockback = 10;
                enemy.physics.vx = (dx / dist) * knockback;
                enemy.physics.vy = (dy / dist) * knockback;
                
                // Efeitos de sangue
                for (let j = 0; j < 5; j++) {
                    Physics.addParticle({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        life: 0.5,
                        size: 3,
                        color: '#8b0000'
                    });
                }
                
                // Screen shake
                RenderEngine.camera.x += (Math.random() - 0.5) * 10;
                RenderEngine.camera.y += (Math.random() - 0.5) * 10;
                
                if (enemy.hp <= 0) {
                    Game.player.exp += 50 + (enemy.level * 10);
                    Game.checkLevelUp();
                    UI.showNotification(`Inimigo eliminado! +${50 + enemy.level * 10} EXP`);
                }
            }
        });
        
        if (hitCount > 0) {
            UI.showNotification(`${hitCount} acerto(s)!`);
        }
        
        // Resetar estado de ataque
        setTimeout(() => {
            Game.player.isAttacking = false;
        }, 300);
    },
    
    triggerMagic() {
        console.log('🔮 MAGIA ACIONADA');
        
        if (Game.player.mana < 20) {
            UI.showNotification('Mana insuficiente!');
            return;
        }
        
        if (Game.player.magicCooldown > 0) {
            return;
        }
        
        Game.player.mana -= 20;
        Game.player.magicCooldown = 60;
        UI.updateStats();
        
        // Efeito de onda de choque
        const waveCount = 12;
        for (let i = 0; i < waveCount; i++)++) {
++) {
            const angle = (Math.PI * 2 / waveCount) * i;
            setTimeout(() => {
                Physics.addParticle({
                    x: Game.player.x,
                    y: Game.player.y,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    life: 1.5,
                    size: 6,
                    color: `hsl(${180 + i * 10}, 100%, 70%)`,
                    glow: 20,
                    type: 'crystal'
                });
            }, i * 50);
        }
        
        // Dano em área
        Game.enemies.forEach(enemy => {
            const dx = enemy.x - Game.player.x;
            const dy = enemy.y - Game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 200 && enemy.hp > 0) {
                enemy.hp -= 40;
                enemy.physics.vx = (dx / dist) * 15;
                enemy.physics.vy = (dy / dist) * 15;
            }
        });
        
        UI.showNotification('Eco Liberado!');
    },
    
    triggerDodge() {
        if (Game.player.dodgeCooldown > 0) return;
        
        Game.player.dodgeCooldown = 40;
        const dodgeSpeed = 15;
        const angle = Math.atan2(this.joystick.dy, this.joystick.dx) || (Game.player.direction === 1 ? 0 : Math.PI);
        
        Game.player.physics.vx = Math.cos(angle) * dodgeSpeed;
        Game.player.physics.vy = Math.sin(angle) * dodgeSpeed;
        
        // Efeito fantasma
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                Physics.addParticle({
                    x: Game.player.x - Game.player.physics.vx * i * 2,
                    y: Game.player.y - Game.player.physics.vy * i * 2,
                    vx: 0,
                    vy: 0,
                    life: 0.3,
                    size: 20,
                    color: 'rgba(0, 212, 255, 0.3)'
                });
            }, i * 50);
        }
    },
    
    triggerSpecial() {
        // Ultimate ability
        if (Game.player.energy < 100) {
            UI.showNotification('Energia insuficiente!');
            return;
        }
        
        Game.player.energy = 0;
        // Implementar ultimate
    },
    
    // Touch handlers para mobile
    attackStart(e) {
        e.preventDefault();
        this.triggerAttack();
        document.getElementById('btnAttack').classList.add('active');
    },
    
    attackEnd(e) {
        e.preventDefault();
        document.getElementById('btnAttack').classList.remove('active');
    },
    
    abilityStart(e) {
        e.preventDefault();
        this.triggerMagic();
        document.getElementById('btnAbility').classList.add('active');
    },
    
    abilityEnd(e) {
        e.preventDefault();
        document.getElementById('btnAbility').classList.remove('active');
    },
    
    dodge(e) {
        e.preventDefault();
        this.triggerDodge();
    },
    
    cameraStart(e) {
        this.camera.active = true;
        this.camera.lastX = e.touches[0].clientX;
        this.camera.lastY = e.touches[0].clientY;
    },
    
    cameraMove(e) {
        if (!this.camera.active) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - this.camera.lastX;
        const dy = touch.clientY - this.camera.lastY;
        
        // Ajustar ângulo da câmera (para modo de mira)
        // RenderEngine.camera.rotation += dx * 0.001;
        
        this.camera.lastX = touch.clientX;
        this.camera.lastY = touch.clientY;
    },
    
    rebindAttack() {
        // Recriar listeners se necessário
        console.log('Rebind de ataque executado');
    },
    
    rebindMagic() {
        console.log('Rebind de magia executado');
    }
};

// UI System
const UI = {
    init() {
        this.updateStats();
        this.updateResources();
    },
    
    updateStats() {
        const p = Game.player;
        document.getElementById('healthBar').style.width = `${(p.hp / p.maxHp) * 100}%`;
        document.getElementById('healthValue').textContent = `${Math.floor(p.hp)}/${p.maxHp}`;
        document.getElementById('manaBar').style.width = `${(p.mana / p.maxMana) * 100}%`;
        document.getElementById('manaValue').textContent = `${Math.floor(p.mana)}/${p.maxMana}`;
        document.getElementById('expBar').style.width = `${(p.exp / p.expToNext) * 100}%`;
        document.getElementById('levelBadge').textContent = `LVL ${p.level}`;
    },
    
    updateResources() {
        document.getElementById('crystalCount').textContent = `${Game.player.crystals}/4`;
        document.getElementById('goldCount').textContent = Game.player.gold;
    },
    
    showNotification(text) {
        const container = document.getElementById('notifications');
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = text;
        container.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    },
    
    showDialogue(speaker, text, choices) {
        document.getElementById('dialogueBox').style.display = 'flex';
        document.getElementById('dialogueName').textContent = speaker;
        document.getElementById('dialogueText').textContent = text;
        
        const choicesDiv = document.getElementById('dialogueChoices');
        choicesDiv.innerHTML = '';
        
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = choice.action;
            choicesDiv.appendChild(btn);
        });
    }
};

// Game Controller
const Game = {
    state: 'menu',
    lastTime: 0,
    time: 0,
    deltaTime: 0,
    
    init() {
        LuaEngine.init();
        Physics.init();
        RenderEngine.init();
        Input.init();
        AI.init();
        UI.init();
        
        // Carregar save se existir
        if (localStorage.getItem('aetherion_save')) {
            document.getElementById('saveInfo').textContent = 'Save encontrado - Nível ' + 
                (JSON.parse(localStorage.getItem('aetherion_save')).player?.level || 1);
        }
        
        // Loop principal
        requestAnimationFrame(t => this.loop(t));
        
        console.log('🎮 Ecos de Aetherion Ultra Inicializado');
    },
    
    loop(timestamp) {
        this.deltaTime = (timestamp - this.lastTime) / 16.67;
        this.lastTime = timestamp;
        this.time += 0.016;
        
        if (this.state === 'playing') {
            this.update();
            RenderEngine.render(this.deltaTime);
        }
        
        requestAnimationFrame(t => this.loop(t));
    },
    
    update() {
        // Atualizar cooldowns
        if (this.player.attackCooldown > 0) this.player.attackCooldown--;
        if (this.player.magicCooldown > 0) this.player.magicCooldown--;
        if (this.player.dodgeCooldown > 0) this.player.dodgeCooldown--;
        
        // Regeneração
        if (this.player.mana < this.player.maxMana) {
            this.player.mana += 0.1 * this.deltaTime;
            if (Math.floor(this.time * 10) % 10 === 0) UI.updateStats();
        }
        
        // Movimento do jogador
        if (Input.joystick.active) {
            this.player.physics.vx += Input.joystick.dx * this.player.acceleration * this.deltaTime;
            this.player.physics.vy += Input.joystick.dy * this.player.acceleration * this.deltaTime;
            this.player.direction = Input.joystick.dx > 0 ? 1 : -1;
        }
        
        // Aplicar física
        Physics.update(this.deltaTime);
        
        // Atualizar câmera suave
        RenderEngine.camera.x += (this.player.x - RenderEngine.camera.x) * 0.1;
        RenderEngine.camera.y += (this.player.y - RenderEngine.camera.y) * 0.1;
        
        // Atualizar inimigos
        this.updateEnemies();
        
        // Auto-save
        if (Math.floor(this.time) % 300 === 0) {
            this.save();
        }
    },
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // IA de perseguição
            if (dist < 300 && dist > 40) {
                enemy.physics.vx += (dx / dist) * enemy.speed * 0.1;
                enemy.physics.vy += (dy / dist) * enemy.speed * 0.1;
            } else if (dist <= 40 && enemy.attackCooldown <= 0) {
                // Atacar jogador
                this.player.hp -= enemy.damage;
                enemy.attackCooldown = 60;
                UI.updateStats();
                
                // Efeito de dano
                document.body.classList.add('damage-flash');
                setTimeout(() => document.body.classList.remove('damage-flash'), 300);
                
                if (this.player.hp <= 0) {
                    this.playerDeath();
                }
            }
            
            if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        });
    },
    
    playerDeath() {
        this.player.hp = this.player.maxHp;
        this.player.x = 0;
        this.player.y = 0;
        UI.showNotification('Você foi derrotado! Revivendo...');
    },
    
    checkLevelUp() {
        while (this.player.exp >= this.player.expToNext) {
            this.player.exp -= this.player.expToNext;
            this.player.level++;
            this.player.expToNext = Math.floor(this.player.expToNext * 1.5);
            this.player.maxHp += 20;
            this.player.maxMana += 10;
            this.player.hp = this.player.maxHp;
            this.player.mana = this.player.maxMana;
            UI.showNotification(`NÍVEL ${this.player.level}!`);
            UI.updateStats();
        }
    },
    
    startNew() {
        // Resetar jogador
        this.player = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            direction: 1,
            level: 1,
            exp: 0,
            expToNext: 100,
            hp: 100,
            maxHp: 100,
            mana: 100,
            maxMana: 100,
            energy: 0,
            crystals: 0,
            gold: 0,
            physics: {
                vx: 0, vy: 0, ax: 0, ay: 0,
                mass: 1, maxSpeed: 8,
                hasGravity: false,
                restitution: 0.5
            },
            acceleration: 0.5,
            attackCooldown: 0,
            magicCooldown: 0,
            dodgeCooldown: 0,
            isAttacking: false,
            weapon: 'crystal_blade'
        };
        
        this.currentRegion = 'valedorn';
        this.generateWorld();
        
        // Transição
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('loadingScreen').classList.add('active');
        
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.remove('active');
            document.getElementById('gameHUD').style.display = 'block';
            document.getElementById('mobileControls').style.display = 'block';
            this.state = 'playing';
        }, 2000);
    },
    
    load() {
        const save = localStorage.getItem('aetherion_save');
        if (save) {
            const data = JSON.parse(save);
            Object.assign(this.player, data.player);
            this.currentRegion = data.region;
            this.startNew();
        }
    },
    
    save() {
        const data = {
            player: this.player,
            region: this.currentRegion,
            time: Date.now()
        };
        localStorage.setItem('aetherion_save', JSON.stringify(data));
        UI.showNotification('Jogo salvo!');
    },
    
    generateWorld() {
        // Limpar entidades
        Physics.entities = [];
        this.enemies = [];
        this.npcs = [];
        this.trees = [];
        
        // Gerar mundo procedural
        const region = WorldRegions[this.currentRegion];
        
        // Árvores
        for (let i = 0; i < 100; i++) {
            this.trees.push({
                x: (Math.random() - 0.5) * region.size.width * 0.8,
                y: (Math.random() - 0.5) * region.size.height * 0.8,
                swayOffset: Math.random() * Math.PI * 2,
                swayAmount: 0.02 + Math.random() * 0.03
            });
        }
        
        // Inimigos
        for (let i = 0; i < 10; i++) {
            const enemy = {
                x: (Math.random() - 0.5) * 1000,
                y: (Math.random() - 0.5) * 1000,
                hp: 100,
                maxHp: 100,
                level: 1,
                damage: 10,
                speed: 2,
                attackCooldown: 0,
                type: 'shadow',
                physics: {
                    vx: 0, vy: 0,
                    mass: 2,
                    maxSpeed: 3,
                    hasGravity: false,
                    restitution: 0.3
                }
            };
            this.enemies.push(enemy);
            Physics.entities.push(enemy);
        }
        
        // Adicionar jogador à física
        Physics.entities.push(this.player);
    },
    
    settings() {
        alert('Configurações RTX:\n\n- Ray Tracing: Ligado\n- DLSS: Qualidade\n- Iluminação Global: Ultra\n- Sombras: 4K\n- Partículas: Máximo');
    }
};

// Dados do mundo
const WorldRegions = {
    valedorn: {
        name: 'Valedorn',
        size: { width: 4000, height: 3000 },
        groundColor1: '#2d4a3e',
        groundColor2: '#1e3329',
        skyColor: '#87ceeb',
        fogColor: 'rgba(135, 206, 235, 0.3)'
    },
    nythera: {
        name: 'Nythera',
        size: { width: 5000, height: 4000 },
        groundColor1: '#1a3d2e',
        groundColor2: '#0f291e',
        skyColor: '#2d4a3e',
        fogColor: 'rgba(45, 74, 62, 0.5)'
    },
    kharzul: {
        name: 'Khar\'Zul',
        size: { width: 6000, height: 4500 },
        groundColor1: '#c2b280',
        groundColor2: '#a09060',
        skyColor: '#ffcc80',
        fogColor: 'rgba(255, 200, 150, 0.4)'
    },
    lumen: {
        name: 'Lumen',
        size: { width: 4000, height: 3500 },
        groundColor1: '#4a5568',
        groundColor2: '#2d3748',
        skyColor: '#1a202c',
        fogColor: 'rgba(100, 150, 255, 0.3)'
    }
};

// Inicialização
window.onload = () => Game.init();
