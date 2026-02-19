// render-engine.js - Renderização Ultra-Realista
const RenderEngine = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
    lights: [],
    shadows: [],
    postProcessing: true,
    
    init() {
        this.canvas = document.getElementById('renderCanvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Offscreen canvas para double buffering
        this.buffer = document.createElement('canvas');
        this.bufferCtx = this.buffer.getContext('2d');
        
        console.log('🎨 Render Engine inicializada (Modo Ultra)');
    },
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.buffer.width = this.width;
        this.buffer.height = this.height;
        
        // Configurar contexto para qualidade máxima
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    },
    
    render(deltaTime) {
        const ctx = this.bufferCtx;
        
        // Limpar com cor de fundo dinâmica
        const region = WorldRegions[Game.currentRegion];
        ctx.fillStyle = region.skyColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Aplicar câmera
        ctx.save();
        ctx.translate(this.width/2, this.height/2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.rotate(this.camera.rotation);
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Renderizar mundo em camadas
        this.renderSky(ctx, region);
        this.renderTerrain(ctx, region);
        this.renderEntities(ctx, deltaTime);
        this.renderEffects(ctx);
        
        ctx.restore();
        
        // Post-processing
        if (this.postProcessing) {
            this.applyPostProcessing(ctx);
        }
        
        // Copiar para canvas principal
        this.ctx.drawImage(this.buffer, 0, 0);
        
        // UI overlay
        this.renderUI();
    },
    
    renderSky(ctx, region) {
        // Gradiente de céu dinâmico baseado na hora
        const time = Game.time || 0;
        const sunY = Math.sin(time * 0.1) * 500 - 200;
        
        const grad = ctx.createLinearGradient(0, -1000, 0, 1000);
        grad.addColorStop(0, region.skyColor);
        grad.addColorStop(0.5, region.groundColor1);
        grad.addColorStop(1, region.groundColor2);
        
        ctx.fillStyle = grad;
        ctx.fillRect(this.camera.x - this.width, this.camera.y - this.height, this.width * 3, this.height * 3);
        
        // Sol/Lua com glow
        ctx.shadowBlur = 100;
        ctx.shadowColor = 'rgba(255, 220, 150, 0.8)';
        ctx.fillStyle = 'rgba(255, 240, 200, 1)';
        ctx.beginPath();
        ctx.arc(this.camera.x + 300, this.camera.y + sunY, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },
    
    renderTerrain(ctx, region) {
        // Sistema de chunks para terreno infinito
        const chunkSize = 500;
        const viewDist = Math.max(this.width, this.height) * 1.5;
        
        const startX = Math.floor((this.camera.x - viewDist) / chunkSize) * chunkSize;
        const startY = Math.floor((this.camera.y - viewDist) / chunkSize) * chunkSize;
        const endX = startX + viewDist * 2;
        const endY = startY + viewDist * 2;
        
        // Textura procedural do terreno
        for (let x = startX; x < endX; x += 50) {
            for (let y = startY; y < endY; y += 50) {
                const noise = this.noise(x * 0.01, y * 0.01);
                const color = noise > 0.5 ? region.groundColor1 : region.groundColor2;
                
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 50, 50);
                
                // Detalhes de textura
                if ((x + y) % 137 === 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    ctx.fillRect(x + 10, y + 10, 30, 30);
                }
            }
        }
        
        // Renderizar árvores com animação de vento
        Game.trees.forEach(tree => {
            this.renderTree(ctx, tree);
        });
    },
    
    renderTree(ctx, tree) {
        const sway = Math.sin(Date.now() * 0.001 + tree.swayOffset) * tree.swayAmount;
        const wind = Math.sin(Date.now() * 0.0005) * 0.02;
        
        // Sombra dinâmica
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(tree.x, tree.y + 40, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tronco com textura
        const trunkGrad = ctx.createLinearGradient(tree.x - 10, tree.y, tree.x + 10, tree.y);
        trunkGrad.addColorStop(0, '#2a1a0a');
        trunkGrad.addColorStop(0.5, '#3d2817');
        trunkGrad.addColorStop(1, '#1a0f05');
        
        ctx.fillStyle = trunkGrad;
        ctx.fillRect(tree.x - 10, tree.y - 20, 20, 60);
        
        // Galhos animados
        ctx.save();
        ctx.translate(tree.x, tree.y - 20);
        ctx.rotate(sway + wind);
        
        // Múltiplas camadas de folhas para profundidade
        const layers = [
            { color: '#0f291e', size: 50, offset: 0 },
            { color: '#1a3d2e', size: 40, offset: -10 },
            { color: '#2d5a3d', size: 30, offset: -20 }
        ];
        
        layers.forEach(layer => {
            ctx.fillStyle = layer.color;
            ctx.beginPath();
            ctx.moveTo(-layer.size, 10 + layer.offset);
            ctx.quadraticCurveTo(0, -layer.size * 1.8, layer.size, 10 + layer.offset);
            ctx.quadraticCurveTo(0, layer.offset, -layer.size, 10 + layer.offset);
            ctx.fill();
        });
        
        // Brilho de subsuperfície nas folhas
        ctx.fillStyle = 'rgba(100, 255, 150, 0.1)';
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(0, -50);
        ctx.lineTo(10, -15);
        ctx.fill();
        
        ctx.restore();
    },
    
    renderEntities(ctx, deltaTime) {
        // Ordenar por profundidade (Y)
        const entities = [
            ...Game.npcs,
            ...Game.enemies,
            Game.player
        ].sort((a, b) => a.y - b.y);
        
        entities.forEach(entity => {
            if (entity === Game.player) {
                this.renderPlayer(ctx, deltaTime);
            } else if (entity.type === 'enemy') {
                this.renderEnemy(ctx, entity);
            } else {
                this.renderNPC(ctx, entity);
            }
        });
    },
    
    renderPlayer(ctx, dt) {
        const p = Game.player;
        
        // Sombra realista
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 35, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Animação de movimento
        const isMoving = Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1;
        const walkCycle = isMoving ? Math.sin(Date.now() * 0.015) : 0;
        const bob = isMoving ? Math.abs(Math.sin(Date.now() * 0.015)) * 4 : 0;
        
        // Partículas de poeira ao andar
        if (isMoving && Math.random() > 0.8) {
            Physics.addParticle({
                x: p.x + (Math.random() - 0.5) * 20,
                y: p.y + 35,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                life: 0.5,
                size: 3,
                color: 'rgba(200,200,200,0.5)'
            });
        }
        
        // Capa com física de tecido simulada
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(p.x - 12 * p.direction, p.y - 15 + bob);
        ctx.quadraticCurveTo(
            p.x - 30 * p.direction + walkCycle * 5, 
            p.y + 10, 
            p.x - 25 * p.direction, 
            p.y + 25 + bob
        );
        ctx.lineTo(p.x - 5 * p.direction, p.y + 20 + bob);
        ctx.fill();
        
        // Pernas animadas
        ctx.fillStyle = '#2c3e50';
        if (isMoving) {
            const legSwing = Math.sin(Date.now() * 0.015) * 8;
            ctx.fillRect(p.x - 8, p.y + 10 + bob, 6, 20 + legSwing);
            ctx.fillRect(p.x + 2, p.y + 10 + bob, 6, 20 - legSwing);
        } else {
            ctx.fillRect(p.x - 8, p.y + 10 + bob, 6, 20);
            ctx.fillRect(p.x + 2, p.y + 10 + bob, 6, 20);
        }
        
        // Corpo com iluminação
        const bodyGrad = ctx.createLinearGradient(p.x - 11, p.y - 20, p.x + 11, p.y + 15);
        bodyGrad.addColorStop(0, '#4a5568');
        bodyGrad.addColorStop(0.5, '#34495e');
        bodyGrad.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(p.x - 11, p.y - 20 + bob, 22, 35);
        
        // Cabeça
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 30 + bob, 11, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos do Eco com brilho intenso
        const eyeGlow = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 212, 255, ${eyeGlow})`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(p.x - 4, p.y - 32 + bob, 3, 0, Math.PI * 2);
        ctx.arc(p.x + 4, p.y - 32 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Arma com brilho mágico
        if (Game.player.weapon === 'crystal_blade') {
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
        }
        
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(p.x + 12 * p.direction, p.y - 5 + bob, 25, 5);
        
        // Lâmina
        ctx.fillStyle = Game.player.weapon === 'crystal_blade' ? '#00d4ff' : '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(p.x + 37 * p.direction, p.y - 5 + bob);
        ctx.lineTo(p.x + 50 * p.direction, p.y - 2 + bob);
        ctx.lineTo(p.x + 37 * p.direction, p.y + 1 + bob);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    },
    
    renderEnemy(ctx, enemy) {
        if (enemy.hp <= 0) return;
        
        // Aura de corrupção
        const corruptionPulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 0, 110, ${0.1 * corruptionPulse})`;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombra distorcida
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + 30, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo com efeito de glitch
        const glitch = Math.random() > 0.95 ? (Math.random() - 0.5) * 10 : 0;
        
        ctx.fillStyle = `rgba(26, 26, 46, ${0.9 + Math.sin(Date.now() * 0.01) * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(enemy.x + glitch, enemy.y - 40);
        ctx.lineTo(enemy.x - 20 + glitch, enemy.y + 30);
        ctx.lineTo(enemy.x + glitch, enemy.y + 20);
        ctx.lineTo(enemy.x + 20 + glitch, enemy.y + 30);
        ctx.closePath();
        ctx.fill();
        
        // Olhos brilhantes
        const eyePulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 0, 110, ${eyePulse})`;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff006e';
        ctx.beginPath();
        ctx.arc(enemy.x - 8, enemy.y - 15, 5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 8, enemy.y - 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Barra de vida
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(enemy.x - 25, enemy.y - 55, 50, 6);
        ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(enemy.x - 25, enemy.y - 55, 50 * hpPercent, 6);
    },
    
    renderEffects(ctx) {
        // Renderizar partículas
        Physics.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = p.glow || 0;
            ctx.shadowColor = p.color;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            if (p.type === 'crystal') {
                // Forma de cristal
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size, 0);
                ctx.lineTo(0, p.size);
                ctx.lineTo(-p.size, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Luzes dinâmicas
        this.lights.forEach(light => {
            const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
            grad.addColorStop(0, light.color);
            grad.addColorStop(1, 'transparent');
            
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalCompositeOperation = 'source-over';
    },
    
    applyPostProcessing(ctx) {
        // Vignette
        const vig = ctx.createRadialGradient(this.width/2, this.height/2, this.height/3, this.width/2, this.height/2, this.height);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Chromatic aberration nas bordas
        // (Simulado através de overlay)
    },
    
    noise(x, y) {
        // Simplex noise simplificado
        return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },
    
    renderUI() {
        // Minimap atualização
        const minimap = document.getElementById('minimapCanvas');
        if (minimap) {
            const mctx = minimap.getContext('2d');
            mctx.fillStyle = 'rgba(0,0,0,0.8)';
            mctx.fillRect(0, 0, 200, 200);
            
            // Desenar entidades no minimap
            mctx.fillStyle = '#0f0';
            Game.enemies.forEach(e => {
                if (e.hp > 0) {
                    const mx = 100 + (e.x - Game.player.x) * 0.1;
                    const my = 100 + (e.y - Game.player.y) * 0.1;
                    mctx.fillRect(mx-2, my-2, 4, 4);
                }
            });
        }
    }
};
