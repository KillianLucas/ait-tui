import React, { useState, useEffect } from 'react';
import { Text, Box, useStdout, useInput } from 'ink';
import TerminalAnimation from './TerminalAnimation.js';
const GROUP_A = [
    { station: 'A1', name: 'Mitchell Kossoris', project: 'Deposely' },
    { station: 'A2', name: 'Caleb Benningfield', project: 'Agents for Databricks' },
    { station: 'A3', name: 'Seshadri Sridharan', project: 'n8n workflow-builder' },
    { station: 'B1', name: 'Nitisha Rathi', project: 'OncallNinja' },
    { station: 'B2', name: 'Prashanthi Matam', project: 'Patrick assistant' },
    { station: 'B3', name: 'John Davidson', project: 'No-code mashups' },
    { station: 'C1', name: 'David Botos', project: 'DoppelGoner' },
    { station: 'C2', project: 'Lounge/Snacks' },
    { station: 'C3', project: 'Overflow Power' },
];
const GROUP_B = [
    { station: 'A1', name: 'Jaymin West', project: 'KOTA assistant' },
    { station: 'A2', name: 'Matt Cummins', project: 'Tactician advisor' },
    { station: 'A3', name: 'Suma Movva', project: 'Replit Agent v2' },
    { station: 'B1', project: 'Open networking' },
    { station: 'B2', project: 'Sponsor demo' },
    { station: 'B3', project: 'Charging bar' },
    { station: 'C1', name: 'Ben Steinher', project: 'AI JAMIE' },
    { station: 'C2', name: 'Marnel Ramirez', project: 'AI Patient Voice' },
    { station: 'C3', name: 'Kamran Tirdad', project: 'Vinchy try-on' },
];
// Utility functions for terminal manipulation
const moveCursor = (x, y) => `\x1b[${y};${x}H`;
const clearChar = (x, y) => `${moveCursor(x, y)} `;
const drawChar = (x, y, char, color) => `${moveCursor(x, y)}${color}${char}\x1b[0m`;
// ANSI colors
const COLORS = [
    '\x1b[91m', // bright red
    '\x1b[93m', // bright yellow
    '\x1b[94m', // bright blue
    '\x1b[95m', // bright magenta
    '\x1b[96m', // bright cyan
    '\x1b[92m', // bright green
];
const MovingDotComponent = ({ dot }) => (React.createElement(Text, { color: dot.color }, dot.char));
const StationBox = ({ presenter }) => (React.createElement(Box, { borderStyle: "single", width: 30, height: 5, alignItems: "center", justifyContent: "center", flexDirection: "column" },
    React.createElement(Text, { bold: true, color: "yellow" }, presenter.station),
    React.createElement(Text, null, presenter.name || ''),
    React.createElement(Text, { dimColor: true }, presenter.project)));
// Glitch effects
const GLITCH_CHARS = '░▒▓█▀▄▌▐│┌┐└┘╔╗╚╝╠╣╦╩╬';
const ANSI_EFFECTS = [
    '\x1b[7m', // Inverse
    '\x1b[5m', // Blink
    '\x1b[1m', // Bold
    '\x1b[2m', // Dim
    '\x1b[31m', // Red
    '\x1b[32m', // Green
    '\x1b[34m', // Blue
    '\x1b[35m', // Magenta
    '\x1b[36m', // Cyan
    '\x1b[37m', // White
];
const App = () => {
    const [isGroupA, setIsGroupA] = useState(true);
    const { stdout } = useStdout();
    const [animation] = useState(() => new TerminalAnimation());
    // Handle Ctrl+C through Ink's useInput
    useInput((input, key) => {
        if (key.ctrl && input === 'c') {
            animation.stop();
            // Reset terminal
            process.stdout.write('\x1b[0m');
            process.stdout.write('\x1b[?25h');
            process.exit(0);
        }
    });
    // Start animation
    useEffect(() => {
        animation.start();
        return () => {
            animation.stop();
        };
    }, []);
    // Handle terminal resize
    useEffect(() => {
        const handleResize = () => {
            animation.resize();
        };
        process.stdout.on('resize', handleResize);
        return () => {
            process.stdout.off('resize', handleResize);
        };
    }, []);
    // Group switching
    useEffect(() => {
        const timer = setInterval(() => {
            setIsGroupA(prev => !prev);
        }, 10000);
        return () => clearInterval(timer);
    }, []);
    const currentGroup = isGroupA ? GROUP_A : GROUP_B;
    return (React.createElement(Box, { flexDirection: "column", height: stdout.rows, alignItems: "center", justifyContent: "center" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" },
                "Group ",
                isGroupA ? 'A' : 'B',
                " - ",
                isGroupA ? '6:30-7:15pm' : '7:30-8:15pm')),
        React.createElement(Box, { marginBottom: 1, width: 130, alignItems: "center" },
            React.createElement(Text, { bold: true }, "             ENTRANCE")),
        React.createElement(Box, { flexDirection: "column" },
            React.createElement(Box, null,
                React.createElement(Box, { width: 35, height: 18, borderStyle: "single", flexDirection: "column", alignItems: "center", justifyContent: "center" },
                    React.createElement(Text, { bold: true }, "MAINSTAGE")),
                React.createElement(Box, { width: 95, height: 18, borderStyle: "single", flexDirection: "column", alignItems: "center" },
                    React.createElement(Box, { marginY: 1 },
                        React.createElement(Text, { bold: true }, "DEMO AREA")),
                    React.createElement(Box, { flexDirection: "column", gap: 1 },
                        React.createElement(Box, null,
                            React.createElement(StationBox, { presenter: currentGroup[0] }),
                            React.createElement(StationBox, { presenter: currentGroup[1] }),
                            React.createElement(StationBox, { presenter: currentGroup[2] })),
                        React.createElement(Box, null,
                            React.createElement(StationBox, { presenter: currentGroup[3] }),
                            React.createElement(StationBox, { presenter: currentGroup[4] }),
                            React.createElement(StationBox, { presenter: currentGroup[5] }))))),
            React.createElement(Box, null,
                React.createElement(Box, { width: 35, height: 10, borderStyle: "single", flexDirection: "column", alignItems: "center", justifyContent: "center" },
                    React.createElement(Text, { bold: true }, "FOOD")),
                React.createElement(Box, { width: 95, height: 10, borderStyle: "single", flexDirection: "column", alignItems: "center" },
                    React.createElement(Box, { marginY: 1 },
                        React.createElement(Text, { bold: true }, "CONFERENCE ROOMS")),
                    React.createElement(Box, null,
                        React.createElement(StationBox, { presenter: currentGroup[6] }),
                        React.createElement(StationBox, { presenter: currentGroup[7] }),
                        React.createElement(StationBox, { presenter: currentGroup[8] })))))));
};
export default App;
