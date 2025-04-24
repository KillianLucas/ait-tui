import { stdout } from 'process';
import { writeFileSync } from 'fs';
export function readTerminalContent() {
    return new Promise((resolve) => {
        const rows = stdout.rows || 24;
        const cols = stdout.columns || 80;
        const content = Array(rows).fill(0).map(() => Array(cols).fill(' '));
        // Save current screen
        process.stdout.write('\x1b[?1049h'); // Switch to alternate buffer
        process.stdout.write('\x1b[2J'); // Clear screen
        // Request cursor position report for each cell
        let currentRow = 0;
        let currentCol = 0;
        let buffer = '';
        const readCell = () => {
            if (currentRow >= rows) {
                // Switch back to main buffer
                process.stdout.write('\x1b[?1049l');
                process.stdin.removeListener('data', handleData);
                process.stdin.setRawMode(false);
                resolve(content);
                return;
            }
            // Move to position and print a marker
            process.stdout.write(`\x1b[${currentRow + 1};${currentCol + 1}H`);
            process.stdout.write('X'); // Write a marker
            process.stdout.write('\x1b[6n'); // Request position
        };
        const handleData = (data) => {
            buffer += data.toString();
            if (buffer.includes('R')) {
                // Got position response, now read what was there
                const char = buffer[0] === 'X' ? ' ' : buffer[0] || ' ';
                content[currentRow][currentCol] = char;
                buffer = '';
                // Move to next position
                currentCol++;
                if (currentCol >= cols) {
                    currentCol = 0;
                    currentRow++;
                }
                // Read next cell
                readCell();
            }
        };
        // Set up raw mode
        process.stdin.setRawMode(true);
        process.stdin.on('data', handleData);
        // Start reading
        readCell();
    });
}
// Example usage:
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    console.log('Reading terminal content...');
    readTerminalContent().then(content => {
        writeFileSync('terminal_content.txt', content.map(row => row.join('')).join('\n'));
        console.log('Terminal content saved to terminal_content.txt');
    });
}
