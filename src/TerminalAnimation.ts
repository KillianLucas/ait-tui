import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import * as readline from 'readline';

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
    '\x1b[32m',  // green
    '\x1b[90m',  // grey
  ];
  private readonly EDGE_COLOR = '\x1b[38;5;240m';  // dimmer grey for edge particles
  private readonly CHARS = ['0', '1', '!', '@', '#', '$', '%', '^', '&', '*'];
  private rl: readline.Interface | null = null;

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

  private initParticles(side: 'left' | 'right' = 'left') {
    // Clear existing particles
    this.particles = [];
    
    // Mark corners as occupied in screenContent
    this.screenContent[0][0] = '0';
    this.screenContent[0][this.width - 1] = '0';
    this.screenContent[this.height - 1][0] = '0';
    this.screenContent[this.height - 1][this.width - 1] = '0';
    
    if (side === 'left') {
      // Left side: 20x20 square, 15 from left, 10 from top
      const squareSize = 20;
      const startY = 10;
      const startX = 15;
      
      for (let y = startY; y < startY + squareSize; y++) {
        for (let x = startX; x < startX + squareSize; x++) {
          if (!this.isSpaceOccupied(x, y)) {
            this.particles.push({
              x,
              y,
              dx: 0,
              dy: 0,
              char: this.CHARS[Math.floor(Math.random() * this.CHARS.length)],
              color: this.COLORS[this.particles.length % this.COLORS.length],
            });
          }
        }
      }
    } else {
      // Right side: 4 tall x 100 wide, 20 from left, 30 from top
      const height = 4;
      const width = 100;
      const startY = 29;
      const startX = 30;

      for (let y = startY; y < startY + height; y++) {
        for (let x = startX; x < startX + width; x++) {
          if (!this.isSpaceOccupied(x, y)) {
            this.particles.push({
              x,
              y, 
              dx: 0,
              dy: 0,
              char: this.CHARS[Math.floor(Math.random() * this.CHARS.length)],
              color: this.COLORS[this.particles.length % this.COLORS.length],
            });
          }
        }
      }
    }

    // Add dimmer gray particles along the left edge (skipping corners)
    for (let y = 1; y < this.height - 1; y += 2) {
      if (!this.isSpaceOccupied(0, y)) {
        this.particles.push({
          x: 0,
          y,
          dx: 0,
          dy: 0,
          char: this.CHARS[Math.floor(Math.random() * this.CHARS.length)],
          color: this.EDGE_COLOR,  // dimmer grey
        });
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

  private getRandomDirection(x: number, y: number): { dx: number; dy: number } {
    const centerX = Math.floor(this.width / 2);
    const rightX = Math.floor(this.width * 0.8); // Right attractor at 80% of width
    const centerY = Math.floor(this.height * 0.2); // Both attractors at upper fifth of screen
    
    // Calculate distances from both attractor points (0 to 1)
    const maxDistance = Math.sqrt(Math.pow(this.width/2, 2) + Math.pow(this.height, 2));
    
    // Distance to center-top point
    const distanceCenter = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));
    const normalizedDistanceCenter = distanceCenter / maxDistance;
    
    // Distance to right-top point
    const distanceRight = Math.sqrt(Math.pow(rightX - x, 2) + Math.pow(centerY - y, 2));
    const normalizedDistanceRight = distanceRight / maxDistance;
    
    // Use the closer attractor point's distance for bias
    const normalizedDistance = Math.min(normalizedDistanceCenter, normalizedDistanceRight);
    
    // Base directions without any bias
    const directions = [
      { dx: 0, dy: 0 },    // pause
      { dx: 1, dy: 0 },    // right
      { dx: -1, dy: 0 },   // left
      { dx: 0, dy: 1 },    // down
      { dx: 0, dy: -1 },   // up
      { dx: 1, dy: 1 },    // diagonal down-right
      { dx: -1, dy: 1 },   // diagonal down-left
      { dx: 1, dy: -1 },   // diagonal up-right
      { dx: -1, dy: -1 }   // diagonal up-left
    ];

    // Pick a random direction
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    // Only apply attractor bias if we're moving
    if (dir.dx !== 0 || dir.dy !== 0) {
      const bias = normalizedDistance * 0.15; // 15% maximum bias
      
      if (Math.random() < bias) {
        // Determine which attractor point to use (use the closer one)
        const useRightAttractor = distanceRight < distanceCenter;
        const targetX = useRightAttractor ? rightX : centerX;
        
        // Adjust direction towards chosen attractor
        if (x < targetX && dir.dx < 0) dir.dx *= -1;
        if (x > targetX && dir.dx > 0) dir.dx *= -1;
        if (y < centerY && dir.dy < 0) dir.dy *= -1;
        if (y > centerY && dir.dy > 0) dir.dy *= -1;
      }
    }
    
    return dir;
  }

  private isTextCharacter(char: string): boolean {
    return /[a-zA-Z0-9]/.test(char);
  }

  private findNearbyText(x: number, y: number, radius: number = 5): { x: number; y: number; distance: number } | null {
    let closest = null;
    let minDistance = radius;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const newX = x + dx;
        const newY = y + dy;
        
        if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
          const char = this.screenContent[newY][newX];
          if (this.isTextCharacter(char)) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
              minDistance = distance;
              closest = { x: newX, y: newY, distance };
            }
          }
        }
      }
    }

    return closest;
  }

  private findNearbyParticles(x: number, y: number, radius: number = 3): number {
    return this.particles.filter(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius && distance > 0; // exclude self
    }).length;
  }

  private updateParticle(particle: Particle): Particle {
    // Special handling for edge particles (dimmer gray)
    if (particle.color === this.EDGE_COLOR) {
      // Completely random movement for edge particles
      if (Math.random() < 0.4) {  // 40% chance to move
        const directions = [
          { dx: 0, dy: 0 },    // stay
          { dx: 1, dy: 0 },    // right
          { dx: -1, dy: 0 },   // left
          { dx: 0, dy: 1 },    // down
          { dx: 0, dy: -1 },   // up
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        particle.dx = randomDir.dx;
        particle.dy = randomDir.dy;
      }

      // Calculate new position
      let newX = Math.round(particle.x + particle.dx);
      let newY = Math.round(particle.y + particle.dy);

      // Prevent moving past x=10 for edge particles
      if (newX > 10) {
        newX = particle.x;
      }

      // If new position is occupied or out of bounds, stay in place
      if (this.isSpaceOccupied(newX, newY) || newY < 0 || newY >= this.height) {
        newX = particle.x;
        newY = particle.y;
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

    // Regular particle behavior for non-edge particles
    const nearbyParticles = this.findNearbyParticles(particle.x, particle.y);
    let changeDirectionChance = 0.4;
    
    if (nearbyParticles > 0) {
      changeDirectionChance = Math.min(0.8, changeDirectionChance + (nearbyParticles * 0.1));
    }
    
    if (Math.random() < changeDirectionChance) {
      const newDir = this.getRandomDirection(particle.x, particle.y);
      particle.dx = newDir.dx;
      particle.dy = newDir.dy;
    } else {
      particle.dx = 0;
      particle.dy = 0;
    }

    // Calculate new position
    let newX = Math.round(particle.x + particle.dx);
    let newY = Math.round(particle.y + particle.dy);

    // If new position is occupied, try to slide along the obstacle
    if (this.isSpaceOccupied(newX, newY)) {
      // Try horizontal movement only
      if (!this.isSpaceOccupied(newX, particle.y)) {
        newY = particle.y;
      }
      // Try vertical movement only
      else if (!this.isSpaceOccupied(particle.x, newY)) {
        newX = particle.x;
      }
      // If both failed, pick a new random direction
      else {
        const newDir = this.getRandomDirection(newX, newY);
        return {
          ...particle,
          dx: newDir.dx,
          dy: newDir.dy
        };
      }
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

  private setupKeyboardInput() {
    if (this.rl) {
      this.rl.close();
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.name === 'up') {
        this.spawnParticles('left');
      } else if (key.name === 'down') {
        this.spawnParticles('right');
      } else if (key.name === 'c' && key.ctrl) {
        this.stop();
        process.exit();
      }
    });
  }

  private spawnParticles(side: 'left' | 'right' = 'left') {
    // Clear any existing particles first
    this.particles = [];
    
    this.initParticles(side);
    
    if (!this.animationFrame) {
      this.animationFrame = setInterval(() => {
        this.particles = this.particles.map(p => this.updateParticle(p));
      }, 200);
    }
  }

  public start() {
    // First ensure we're fully stopped
    this.stop();

    // Setup keyboard input
    this.setupKeyboardInput();

    // Immediately place '0' characters in all four corners
    process.stdout.write(`${this.moveCursor(0, 0)}0`);
    process.stdout.write(`${this.moveCursor(this.width - 1, 0)}0`);
    process.stdout.write(`${this.moveCursor(0, this.height - 1)}0`);
    process.stdout.write(`${this.moveCursor(this.width - 1, this.height - 1)}0`);

    // Add the terminal layout content, batching writes
    try {
      const layoutContent = readFileSync('terminal_add.txt', 'utf8').split('\n');
      let outputBuffer = '';
      
      for (let y = 0; y < Math.min(layoutContent.length, this.height); y++) {
        const chars = Array.from(layoutContent[y]);
        for (let x = 0; x < Math.min(chars.length, this.width); x++) {
          if (chars[x] === 'X') {
            outputBuffer += `${this.moveCursor(x, y)} `;
            this.screenContent[y][x] = ' ';
          } else if (chars[x] !== ' ') {
            outputBuffer += `${this.moveCursor(x, y)}${chars[x]}`;
            this.screenContent[y][x] = chars[x];
          }
        }
      }
      // Write all changes at once
      process.stdout.write(outputBuffer);
    } catch (error) {
      console.error('Failed to read terminal_add.txt');
    }

    this.contentRefreshInterval = setInterval(() => this.refreshContent(), 1000);
  }

  public stop() {
    // Clear all intervals and timeouts
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.contentRefreshInterval) {
      clearInterval(this.contentRefreshInterval);
      this.contentRefreshInterval = null;
    }
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    // Clear all particles
    this.particles.forEach(p => {
      process.stdout.write(`${this.moveCursor(p.x, p.y)} `);
    });
    this.particles = [];
    
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