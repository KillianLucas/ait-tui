import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
export function readTmuxContent() {
    var _a;
    try {
        // Capture the current pane content
        const output = execSync('tmux capture-pane -p').toString();
        // Split into rows and convert to character array
        const rows = output.split('\n');
        const content = rows.map(row => Array.from(row));
        return content;
    }
    catch (error) {
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('not inside tmux')) {
            throw new Error('This script must be run inside a tmux session');
        }
        throw error;
    }
}
// Example usage:
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    try {
        console.log('Reading tmux content...');
        const content = readTmuxContent();
        writeFileSync('screen_content.txt', content.map(row => row.join('')).join('\n'));
        console.log('Screen content has been saved to screen_content.txt');
    }
    catch (error) {
        console.error('Error:', error.message);
    }
}
