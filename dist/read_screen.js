import { readTerminalContent } from './terminal_reader.js';
import { writeFileSync } from 'fs';
// Wait a bit for the screen to be ready
setTimeout(async () => {
    try {
        const content = await readTerminalContent();
        // Log the content to a file to not interfere with the screen
        writeFileSync('terminal_content.txt', content.map(row => row.join('')).join('\n'));
        console.log('\n\nScreen content has been saved to terminal_content.txt');
    }
    catch (error) {
        console.error('Error reading screen:', error);
    }
}, 1000);
