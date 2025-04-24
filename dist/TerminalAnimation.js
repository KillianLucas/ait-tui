import { execSync } from 'child_process';
class TerminalAnimation {
    constructor() {
        this.particles = [];
        this.screenContent = [];
        this.animationFrame = null;
        this.contentRefreshInterval = null;
        this.regions = [];
        this.COLORS = [
            '\x1b[91m', // bright red
            '\x1b[93m', // bright yellow
            '\x1b[94m', // bright blue
            '\x1b[95m', // bright magenta
            '\x1b[96m', // bright cyan
            '\x1b[92m', // bright green
        ];
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;
        this.initScreenContent();
        this.initParticles();
    }
    initScreenContent() {
        try {
            // Get screen content from tmux
            const output = execSync('tmux capture-pane -p').toString();
            const rows = output.split('\n');
            // Initialize with empty content
            this.screenContent = Array(this.height).fill(0).map(() => Array(this.width).fill(' '));
            // Copy content while respecting bounds
            for (let y = 0; y < Math.min(rows.length, this.height); y++) {
                const chars = Array.from(rows[y]);
                for (let x = 0; x < Math.min(chars.length, this.width); x++) {
                    this.screenContent[y][x] = chars[x];
                }
            }
        }
        catch (error) {
            console.error('Failed to read tmux content, using empty screen');
            this.screenContent = Array(this.height).fill(0).map(() => Array(this.width).fill(' '));
        }
    }
    initParticles() {
        const numParticles = Math.floor((this.width * this.height) / 400); // Reduced density
        this.particles = [];
        // Try to place particles in empty spaces
        for (let i = 0; i < numParticles; i++) {
            let attempts = 0;
            let particle = null;
            while (attempts < 50 && !particle) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                if (!this.isSpaceOccupied(x, y)) {
                    particle = {
                        x,
                        y,
                        dx: (Math.random() - 0.5) * 1.5,
                        dy: (Math.random() - 0.5) * 1.5,
                        char: '•',
                        color: this.COLORS[i % this.COLORS.length]
                    };
                }
                attempts++;
            }
            if (particle) {
                this.particles.push(particle);
            }
        }
    }
    moveCursor(x, y) {
        return `\x1b[${Math.floor(y) + 1};${Math.floor(x) + 1}H`;
    }
    isSpaceOccupied(x, y) {
        const roundX = Math.floor(x);
        const roundY = Math.floor(y);
        // Check bounds
        if (roundX < 0 || roundX >= this.width || roundY < 0 || roundY >= this.height) {
            return true;
        }
        // Check if space contains non-empty character
        return this.screenContent[roundY][roundX] !== ' ';
    }
    checkCollision(x, y) {
        const positions = [
            { x: Math.floor(x), y: Math.floor(y) },
            { x: Math.floor(x + 0.5), y: Math.floor(y) },
            { x: Math.floor(x), y: Math.floor(y + 0.5) },
            { x: Math.floor(x + 0.5), y: Math.floor(y + 0.5) }
        ];
        for (const pos of positions) {
            if (this.isSpaceOccupied(pos.x, pos.y)) {
                // Calculate normal vector pointing away from collision
                const normal = {
                    x: x - pos.x,
                    y: y - pos.y
                };
                // Normalize
                const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
                if (length > 0) {
                    normal.x /= length;
                    normal.y /= length;
                }
                return { collided: true, normal };
            }
        }
        return { collided: false, normal: { x: 0, y: 0 } };
    }
    updateParticle(particle) {
        let newX = particle.x + particle.dx;
        let newY = particle.y + particle.dy;
        let newDx = particle.dx;
        let newDy = particle.dy;
        // Check for collisions with screen content
        const collision = this.checkCollision(newX, newY);
        if (collision.collided) {
            // Reflect velocity based on collision normal
            const dot = newDx * collision.normal.x + newDy * collision.normal.y;
            newDx = newDx - 2 * dot * collision.normal.x;
            newDy = newDy - 2 * dot * collision.normal.y;
            // Move back to previous position and add some randomness
            newX = particle.x;
            newY = particle.y;
            newDx += (Math.random() - 0.5) * 0.2;
            newDy += (Math.random() - 0.5) * 0.2;
        }
        // Check for collisions with boundaries
        if (newX <= 0 || newX >= this.width - 1) {
            newDx *= -1;
            newX = Math.max(0, Math.min(this.width - 1, newX));
        }
        if (newY <= 0 || newY >= this.height - 1) {
            newDy *= -1;
            newY = Math.max(0, Math.min(this.height - 1, newY));
        }
        // Add small random variations to movement
        newDx += (Math.random() - 0.5) * 0.05;
        newDy += (Math.random() - 0.5) * 0.05;
        // Normalize velocity
        const speed = Math.sqrt(newDx * newDx + newDy * newDy);
        if (speed > 1.5) { // Reduced max speed
            newDx = (newDx / speed) * 1.5;
            newDy = (newDy / speed) * 1.5;
        }
        return {
            ...particle,
            x: newX,
            y: newY,
            dx: newDx,
            dy: newDy
        };
    }
    addRegion(x, y, width, height) {
        this.regions.push({ x, y, width, height });
        // Mark region in shadow buffer
        for (let i = y; i < y + height && i < this.height; i++) {
            for (let j = x; j < x + width && j < this.width; j++) {
                if (i >= 0 && j >= 0) {
                    this.screenContent[i][j] = ' ';
                }
            }
        }
    }
    clearRegions() {
        this.regions = [];
        this.initScreenContent();
    }
    refreshContent() {
        this.initScreenContent();
    }
    start() {
        if (this.animationFrame) {
            clearInterval(this.animationFrame);
        }
        // Refresh content periodically
        const contentInterval = setInterval(() => this.refreshContent(), 1000);
        this.animationFrame = setInterval(() => {
            // Clear previous positions
            this.particles.forEach(p => {
                if (!this.isSpaceOccupied(p.x, p.y)) {
                    process.stdout.write(`${this.moveCursor(p.x, p.y)} `);
                }
            });
            // Update and draw new positions
            this.particles = this.particles.map(p => this.updateParticle(p));
            this.particles.forEach(p => {
                if (!this.isSpaceOccupied(p.x, p.y)) {
                    process.stdout.write(`${this.moveCursor(p.x, p.y)}${p.color}${p.char}\x1b[0m`);
                }
            });
        }, 50);
        // Store content refresh interval
        this.contentRefreshInterval = contentInterval;
    }
    stop() {
        if (this.animationFrame) {
            clearInterval(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.contentRefreshInterval) {
            clearInterval(this.contentRefreshInterval);
            this.contentRefreshInterval = null;
        }
        // Clear particles
        this.particles.forEach(p => {
            if (!this.isSpaceOccupied(p.x, p.y)) {
                process.stdout.write(`${this.moveCursor(p.x, p.y)} `);
            }
        });
        // Reset terminal
        process.stdout.write('\x1b[0m');
    }
    resize() {
        this.width = process.stdout.columns || 80;
        this.height = process.stdout.rows || 24;
        this.initScreenContent();
        this.initParticles();
    }
}
export default TerminalAnimation;
