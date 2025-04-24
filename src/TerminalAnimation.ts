import { execSync } from 'child_process';

type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  char: string;
  color: string;
};

type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

class TerminalAnimation {
  private particles: Particle[] = [];
  private width: number;
  private height: number;
  private screenContent: string[][] = [];
  private animationFrame: NodeJS.Timeout | null = null;
  private contentRefreshInterval: NodeJS.Timeout | null = null;
  private regions: Region[] = [];
  private readonly COLORS = [
    '\x1b[91m', // bright red
    '\x1b[93m', // bright yellow
    '\x1b[94m', // bright blue
    '\x1b[95m', // bright magenta
    '\x1b[96m', // bright cyan
    '\x1b[92m', // bright green
  ];

  constructor() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;
    this.initScreenContent();
    this.initParticles();
  }

  private initScreenContent() {
    try {
      const output = execSync('tmux capture-pane -p').toString();
      const rows = output.split('\n');
      this.screenContent = Array(this.height).fill(0).map(() => Array(this.width).fill(' '));
      for (let y = 0; y < Math.min(rows.length, this.height); y++) {
        const chars = Array.from(rows[y]);
        for (let x = 0; x < Math.min(chars.length, this.width); x++) {
          this.screenContent[y][x] = chars[x];
        }
      }
    } catch (error) {
      console.error('Failed to read tmux content, using empty screen');
      this.screenContent = Array(this.height).fill(0).map(() => Array(this.width).fill(' '));
    }
  }

  private initParticles() {
    const numParticles = Math.floor((this.width * this.height) / 400);
    this.particles = [];
    
    for (let i = 0; i < numParticles; i++) {
      let attempts = 0;
      let particle: Particle | null = null;
      
      while (attempts < 50 && !particle) {
        const x = Math.floor(Math.random() * (this.width - 4) + 2);
        const y = Math.floor(Math.random() * (this.height - 4) + 2);
        
        if (!this.isSpaceOccupied(x, y)) {
          particle = {
            x,
            y,
            dx: 0,
            dy: 0,
            char: '•',
            color: this.COLORS[i % this.COLORS.length],
          };
        }
        attempts++;
      }
      
      if (particle) {
        this.particles.push(particle);
      }
    }
  }

  private isSpaceOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
    return this.screenContent[y][x] !== ' ';
  }

  private moveCursor(x: number, y: number): string {
    return `\x1b[${y + 1};${x + 1}H`;
  }

  private getRandomDirection(): { dx: number; dy: number } {
    const directions = [
      { dx: 0, dy: 0 },    // pause
      { dx: 1, dy: 0 },    // right
      { dx: -1, dy: 0 },   // left
      { dx: 0, dy: 1 },    // down
      { dx: 0, dy: -1 },   // up
      { dx: 1, dy: 1 },    // diagonal down-right
      { dx: -1, dy: 1 },   // diagonal down-left
      { dx: 1, dy: -1 },   // diagonal up-right
      { dx: -1, dy: -1 },  // diagonal up-left
    ];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private updateParticle(particle: Particle): Particle {
    // Randomly change direction (10% chance each frame)
    if (Math.random() < 0.1) {
      const newDir = this.getRandomDirection();
      particle.dx = newDir.dx;
      particle.dy = newDir.dy;
    }

    const newX = particle.x + particle.dx;
    const newY = particle.y + particle.dy;

    // If new position is occupied (or out of bounds), pick a new random direction
    if (this.isSpaceOccupied(newX, newY)) {
      const newDir = this.getRandomDirection();
      return {
        ...particle,
        dx: newDir.dx,
        dy: newDir.dy
      };
    }

    // Clear old position
    process.stdout.write(`${this.moveCursor(particle.x, particle.y)} `);
    
    // Draw new position
    process.stdout.write(`${this.moveCursor(newX, newY)}${particle.color}${particle.char}\x1b[0m`);

    return {
      ...particle,
      x: newX,
      y: newY
    };
  }

  public start() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
    }

    const contentInterval = setInterval(() => this.refreshContent(), 1000);

    // Clear any existing particles first
    this.particles = [];

    // Wait 2 seconds before spawning particles
    setTimeout(() => {
      this.initParticles();
      this.animationFrame = setInterval(() => {
        this.particles = this.particles.map(p => this.updateParticle(p));
      }, 50);
    }, 2000);

    this.contentRefreshInterval = contentInterval;
  }

  public stop() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.contentRefreshInterval) {
      clearInterval(this.contentRefreshInterval);
      this.contentRefreshInterval = null;
    }
    
    // Clear all particles
    this.particles.forEach(p => {
      process.stdout.write(`${this.moveCursor(p.x, p.y)} `);
    });
    
    process.stdout.write('\x1b[0m');
  }

  public addRegion(x: number, y: number, width: number, height: number) {
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

  public clearRegions() {
    this.regions = [];
    this.initScreenContent();
  }

  public refreshContent() {
    this.initScreenContent();
  }

  public resize() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;
    this.initScreenContent();
    this.initParticles();
  }
}

export default TerminalAnimation; 