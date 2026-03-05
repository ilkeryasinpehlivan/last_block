/**
 * effects.js
 * Handles particles, screen shake, and visual polish.
 */

const Effects = {
    ctx: null,
    particles: [],

    init: function (ctx) {
        this.ctx = ctx;
    },

    createExplosion: function (x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.02
            });
        }
    },

    createFirework: function (x, y, color) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 2,
                color: color,
                life: 1.5,
                decay: Math.random() * 0.03 + 0.015,
                glow: true
            });
        }
    },

    updateAndDraw: function (dt) {
        if (!this.ctx) return;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            if (p.glow) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;
            }
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        this.ctx.globalAlpha = 1.0;
    },

    shake: function (el) {
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 500);
    }
};

window.Effects = Effects;
