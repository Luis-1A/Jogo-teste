// lua-engine.js - Interpretador Lua para Scripts de IA
const LuaEngine = {
    state: null,
    scripts: new Map(),
    
    init() {
        // Simulação de estado Lua
        this.state = {
            globals: {},
            stack: [],
            callStack: []
        };
        console.log('🌙 Lua Engine inicializada');
    },
    
    // Executar script Lua
    execute(code, context = {}) {
        try {
            // Parser simplificado de Lua para JS
            const jsCode = this.transpile(code);
            const fn = new Function('context', 'Game', 'World', 'AI', jsCode);
            return fn(context, Game, World, AI);
        } catch(e) {
            console.error('Lua Error:', e);
            AI.reportBug('lua_execution', e.message, code);
            return null;
        }
    },
    
    // Transpilar Lua -> JavaScript
    transpile(luaCode) {
        // Conversões básicas
        let js = luaCode
            .replace(/--.*$/gm, '') // Remover comentários
            .replace(/local\s+/g, 'let ')
            .replace(/function\s+(\w+)\s*\((.*?)\)/g, 'function $1($2)')
            .replace(/if\s+(.*?)\s+then/g, 'if ($1) {')
            .replace(/else/g, '} else {')
            .replace(/end/g, '}')
            .replace(/and/g, '&&')
            .replace(/or/g, '||')
            .replace(/not/g, '!')
            .replace(/~= /g, '!== ')
            .replace(/== /g, '=== ')
            .replace(/nil/g, 'null')
            .replace(/print\(/g, 'console.log(');
        
        return js;
    },
    
    // Carregar script de arquivo
    load(name, code) {
        this.scripts.set(name, code);
        console.log(`📜 Script Lua carregado: ${name}`);
    }
};

// physics-engine.js - Física Realista
const Physics = {
    gravity: 0.5,
    friction: 0.85,
    entities: [],
    particles: [],
    collisions: [],
    
    init() {
        this.spatialGrid = new SpatialGrid(100);
        console.log('⚙️ Physics Engine inicializada');
    },
    
    update(deltaTime) {
        // Atualizar entidades
        this.entities.forEach(entity => {
            if (entity.physics) {
                this.applyPhysics(entity, deltaTime);
            }
        });
        
        // Atualizar partículas
        this.particles = this.particles.filter(p => {
            p.vx *= this.friction;
            p.vy *= this.friction;
            p.vy += this.gravity * p.mass;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.rotation += p.angularVelocity;
            return p.life > 0;
        });
        
        // Detecção de colisão otimizada
        this.checkCollisions();
    },
    
    applyPhysics(entity, dt) {
        const p = entity.physics;
        
        // Aplicar forças
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        
        // Gravidade se aplicável
        if (p.hasGravity) {
            p.vy += this.gravity * dt;
        }
        
        // Friction
        p.vx *= this.friction;
        p.vy *= this.friction;
        
        // Limitar velocidade
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > p.maxSpeed) {
            p.vx = (p.vx / speed) * p.maxSpeed;
            p.vy = (p.vy / speed) * p.maxSpeed;
        }
        
        // Atualizar posição
        entity.x += p.vx * dt;
        entity.y += p.vy * dt;
        
        // Colisão com mundo
        this.worldCollision(entity);
    },
    
    worldCollision(entity) {
        const region = WorldRegions[Game.currentRegion];
        const halfWidth = region.size.width / 2;
        const halfHeight = region.size.height / 2;
        
        if (entity.x < -halfWidth) { entity.x = -halfWidth; entity.physics.vx *= -0.5; }
        if (entity.x > halfWidth) { entity.x = halfWidth; entity.physics.vx *= -0.5; }
        if (entity.y < -halfHeight) { entity.y = -halfHeight; entity.physics.vy *= -0.5; }
        if (entity.y > halfHeight) { entity.y = halfHeight; entity.physics.vy *= -0.5; }
    },
    
    checkCollisions() {
        // Grid espacial para otimização
        this.spatialGrid.clear();
        this.entities.forEach(e => this.spatialGrid.insert(e));
        
        // Verificar colisões apenas entre entidades próximas
        for (let i = 0; i < this.entities.length; i++) {
            const nearby = this.spatialGrid.query(this.entities[i]);
            for (let other of nearby) {
                if (other !== this.entities[i]) {
                    this.resolveCollision(this.entities[i], other);
                }
            }
        }
    },
    
    resolveCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.radius || 20) + (b.radius || 20);
        
        if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Separar
            const totalMass = (a.physics?.mass || 1) + (b.physics?.mass || 1);
            const ratioA = (b.physics?.mass || 1) / totalMass;
            const ratioB = (a.physics?.mass || 1) / totalMass;
            
            a.x -= nx * overlap * ratioA;
            a.y -= ny * overlap * ratioA;
            b.x += nx * overlap * ratioB;
            b.y += ny * overlap * ratioB;
            
            // Transferir momentum
            if (a.physics && b.physics) {
                const dvx = b.physics.vx - a.physics.vx;
                const dvy = b.physics.vy - a.physics.vy;
                const velAlongNormal = dvx * nx + dvy * ny;
                
                if (velAlongNormal > 0) return;
                
                const e = Math.min(a.physics.restitution || 0.5, b.physics.restitution || 0.5);
                let j = -(1 + e) * velAlongNormal;
                j /= (1/a.physics.mass + 1/b.physics.mass);
                
                const impulseX = j * nx;
                const impulseY = j * ny;
                
                a.physics.vx -= impulseX / a.physics.mass;
                a.physics.vy -= impulseY / a.physics.mass;
                b.physics.vx += impulseX / b.physics.mass;
                b.physics.vy += impulseY / b.physics.mass;
            }
            
            // Callback de colisão
            if (a.onCollision) a.onCollision(b);
            if (b.onCollision) b.onCollision(a);
        }
    },
    
    addParticle(config) {
        this.particles.push({
            x: config.x,
            y: config.y,
            vx: config.vx || 0,
            vy: config.vy || 0,
            life: config.life || 1,
            maxLife: config.life || 1,
            size: config.size || 5,
            color: config.color || '#fff',
            mass: config.mass || 1,
            rotation: 0,
            angularVelocity: (Math.random() - 0.5) * 0.2,
            type: config.type || 'normal'
        });
    },
    
    raycast(x, y, angle, maxDist) {
        // Raycasting simplificado
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        
        for (let dist = 0; dist < maxDist; dist += 5) {
            const px = x + dx * dist;
            const py = y + dy * dist;
            
            // Verificar colisão com entidades
            for (let entity of this.entities) {
                const ex = entity.x - px;
                const ey = entity.y - py;
                if (Math.sqrt(ex*ex + ey*ey) < (entity.radius || 20)) {
                    return { hit: true, entity, distance: dist, x: px, y: py };
                }
            }
        }
        
        return { hit: false, distance: maxDist };
    }
};

// Spatial Grid para otimização de colisão
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    
    clear() {
        this.cells.clear();
    }
    
    getKey(x, y) {
        return `${Math.floor(x/this.cellSize)},${Math.floor(y/this.cellSize)}`;
    }
    
    insert(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(entity);
    }
    
    query(entity) {
        const key = this.getKey(entity.x, entity.y);
        return this.cells.get(key) || [];
    }
}
