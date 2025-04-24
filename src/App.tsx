import React, { useState, useEffect } from 'react';
import { Text, Box, useStdout, useInput } from 'ink';
import TerminalAnimation from './TerminalAnimation.js';

type Presenter = {
  station: string;
  name?: string;
  project: string;
};

const GROUP_A: Presenter[] = [
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

const GROUP_B: Presenter[] = [
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

const StationBox: React.FC<{ presenter: Presenter }> = ({ presenter }) => (
  <Box
    borderStyle="single"
    width={30}
    height={5}
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
  >
    <Text bold color="yellow">{presenter.station}</Text>
    <Text>{presenter.name || ''}</Text>
    <Text dimColor>{presenter.project}</Text>
  </Box>
);

const App: React.FC = () => {
  const [isGroupA, setIsGroupA] = useState(true);
  const { stdout } = useStdout();
  const [animation] = useState(() => new TerminalAnimation());

  // Handle Ctrl+C
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      animation.stop();
      process.stdout.write('\x1b[0m');
      process.stdout.write('\x1b[?25h');
      process.exit(0);
    }
  });

  // Start/stop animation
  useEffect(() => {
    animation.start();
    return () => animation.stop();
  }, []);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => animation.resize();
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

  return (
    <Box 
      flexDirection="column" 
      height={stdout.rows} 
      alignItems="center"
      justifyContent="center"
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Group {isGroupA ? 'A' : 'B'} - {isGroupA ? '6:30-7:15pm' : '7:30-8:15pm'}
        </Text>
      </Box>
      <Box marginBottom={1} width={130} alignItems="center">
        <Text bold>             ENTRANCE</Text>
      </Box>

      <Box flexDirection="column">
        {/* Top section: Mainstage + Demo Area */}
        <Box>
          {/* Mainstage */}
          <Box 
            width={35} 
            height={18} 
            borderStyle="single"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Text bold>MAINSTAGE</Text>
          </Box>

          {/* Demo Area */}
          <Box 
            width={95} 
            height={18} 
            borderStyle="single"
            flexDirection="column"
            alignItems="center"
          >
            <Box marginY={1}>
              <Text bold>DEMO AREA</Text>
            </Box>
            <Box flexDirection="column" gap={1}>
              <Box>
                <StationBox presenter={currentGroup[0]} />
                <StationBox presenter={currentGroup[1]} />
                <StationBox presenter={currentGroup[2]} />
              </Box>
              <Box>
                <StationBox presenter={currentGroup[3]} />
                <StationBox presenter={currentGroup[4]} />
                <StationBox presenter={currentGroup[5]} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom section: Food + Conference Area */}
        <Box>
          {/* Food Area */}
          <Box 
            width={35} 
            height={10} 
            borderStyle="single"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Text bold>FOOD</Text>
          </Box>

          {/* Conference Area */}
          <Box 
            width={95} 
            height={10} 
            borderStyle="single"
            flexDirection="column"
            alignItems="center"
          >
            <Box marginY={1}>
              <Text bold>CONFERENCE ROOMS</Text>
            </Box>
            <Box>
              <StationBox presenter={currentGroup[6]} />
              <StationBox presenter={currentGroup[7]} />
              <StationBox presenter={currentGroup[8]} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App; 