import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
export function readScreenContent() {
    var _a;
    try {
        // Capture the current screen content using hardcopy
        const tempFile = '/tmp/screen_content_temp';
        execSync(`screen -X hardcopy ${tempFile}`);
        // Read the content
        const output = execSync(`cat ${tempFile}`).toString();
        // Clean up
        execSync(`rm ${tempFile}`);
        // Split into rows and convert to character array
        const rows = output.split('\n');
        const content = rows.map(row => Array.from(row));
        return content;
    }
    catch (error) {
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('screen')) {
            throw new Error('This script must be run inside a screen session');
        }
        throw error;
    }
}
// Example usage:
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    try {
        console.log('Reading screen content...');
        const content = readScreenContent();
        writeFileSync('screen_content.txt', content.map(row => row.join('')).join('\n'));
        console.log('Screen content has been saved to screen_content.txt');
    }
    catch (error) {
        console.error('Error:', error.message);
    }
}
