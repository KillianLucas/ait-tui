import TerminalAnimation from './TerminalAnimation.js';
// Create and start animation
const animation = new TerminalAnimation();
// Handle Ctrl+C
process.on('SIGINT', () => {
    animation.stop();
    process.exit(0);
});
// Handle terminal resize
process.stdout.on('resize', () => {
    animation.resize();
});
// Start animation
animation.start();
