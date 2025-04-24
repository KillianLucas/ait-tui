import React, { useState, useEffect } from 'react';
import { Text, Box, useStdout, useInput } from 'ink';
import TerminalAnimation from './TerminalAnimation.js';

type Presenter = {
  station?: string;
  name?: string;
  project: string;
  tags?: string;
  pitch?: string;
};

const GROUP_A: Presenter[] = [
  { name: 'Mitchell Kossoris', project: 'Deposely', tags: 'LegalTech · Real-time', pitch: 'AI co-counsel flags contradictions live.' },
  { name: 'Caleb Benningfield', project: 'CDP Agent', tags: 'Data · Agents', pitch: 'Agent turns specs into Databricks notebooks.' },
  { name: 'Seshadri Sridharan', project: 'Chat-to-n8n', tags: 'Automation · Workflows', pitch: 'Conversation outputs runnable n8n flows.' },
  { name: 'Nitisha Rathi', project: 'OncallNinja', tags: 'DevOps · Incidents', pitch: 'AI teammate resolves PagerDuty pages.' },
  { name: 'Prashanthi Matam', project: 'Patrick', tags: 'Office · Desktop', pitch: 'Desktop agent reads mail, drafts Docs securely.' },
  { name: 'John Davidson', project: 'Mashup Maker', tags: 'No-code · Images', pitch: 'Build GPT-4 + DALL·E animal mashups fast.' },
  { name: 'David Botos', project: 'DoppelGoner', tags: 'Embeddings · Rust', pitch: 'Rust + pgvector clusters duplicate records.' },
  { project: 'Mystery Demo (Free)' },
  { project: 'Mystery Demo (Free)' },
];

const GROUP_B: Presenter[] = [
  { name: 'Jaymin West', project: 'KOTA', tags: 'Personal AI · Local', pitch: 'Markdown brain that self-refactors and pings you.' },
  { name: 'Matt Cummins', project: 'Tactician', tags: 'Org Behavior · Advice', pitch: 'Multi-persona coach for sticky workplace politics.' },
  { name: 'Suma Movva', project: 'Vibe Coding', tags: 'DevTools · Coding', pitch: 'When to trust Replit Agent vs Claude.' },
  { project: 'Mystery Demo (Free)' },
  { project: 'Mystery Demo (Free)' },
  { project: 'Mystery Demo (Free)' },
  { name: 'Ben Steinher', project: 'AI JAMIE', tags: 'Collab · Voice', pitch: 'Infinite canvas with agents and live transcript.' },
  { name: 'Marnel Ramirez', project: 'Patient Simulator', tags: 'Healthcare · Voice', pitch: 'Talking diabetic patient for consult practice.' },
  { name: 'Kamran Tirdad', project: 'Vinchy', tags: 'Fashion · CV', pitch: 'Body-to-garment match with instant try-on.' },
];

const Corner: React.FC<{ type: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' }> = ({ type }) => {
  const corners = {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘'
  };
  return <Text>{corners[type]}</Text>;
};

const BoxWithCorners: React.FC<{ width: number; height: number; children: React.ReactNode }> = ({ width, height, children }) => (
  <Box flexDirection="column" width={width} height={height}>
    <Box>
      <Corner type="topLeft" />
      <Box flexGrow={1} />
      <Corner type="topRight" />
    </Box>
    <Box flexGrow={1}>
      {children}
    </Box>
    <Box>
      <Corner type="bottomLeft" />
      <Box flexGrow={1} />
      <Corner type="bottomRight" />
    </Box>
  </Box>
);

const StationBox: React.FC<{ presenter: Presenter; isSelected?: boolean }> = ({ presenter, isSelected }) => (
  <Box
    borderStyle="single"
    width={32}
    height={7}
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
  >
    <Box width={29} alignItems="center" justifyContent="center" flexDirection="column">
      {presenter.name ? (
        <>
          <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : undefined} bold>{presenter.name}</Text>
          <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "green"}>{presenter.project}</Text>
          {presenter.tags && <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "white"}>{presenter.tags}</Text>}
          {presenter.pitch && <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "grey"} italic>{presenter.pitch}</Text>}
        </>
      ) : (
        <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "grey"}>Mystery Demo (Free)</Text>
      )}
    </Box>
  </Box>
);

const BorderlessStationBox: React.FC<{ presenter: Presenter; isSelected?: boolean }> = ({ presenter, isSelected }) => (
  <Box
    width={33}
    height={7}
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
  >
    <Box width={29} alignItems="center" justifyContent="center" flexDirection="column">
      {presenter.name ? (
        <>
          <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : undefined} bold>{presenter.name}</Text>
          <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "green"}>{presenter.project}</Text>
          {presenter.tags && <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "white"}>{presenter.tags}</Text>}
          {presenter.pitch && <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "grey"} italic>{presenter.pitch}</Text>}
        </>
      ) : (
        <Text backgroundColor={isSelected ? "white" : undefined} color={isSelected ? "black" : "grey"}>Mystery Demo (Free)</Text>
      )}
    </Box>
  </Box>
);

interface AppProps {
  group?: string;
}

const App: React.FC<AppProps> = ({ group = 'A' }) => {
  const [currentGroup, setCurrentGroup] = useState(group.toUpperCase());
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means no selection
  const isGroupA = currentGroup === 'A';
  const { stdout } = useStdout();
  const [animation] = useState(() => new TerminalAnimation());

  // Handle Ctrl+C, spacebar, and arrow keys
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      animation.stop();
      process.stdout.write('\x1b[0m');
      process.stdout.write('\x1b[?25h');
      process.exit(0);
    }
    if (input === ' ') {
      setCurrentGroup(prev => prev === 'A' ? 'B' : 'A');
      setSelectedIndex(-1); // Reset selection when switching groups
      animation.stop();
    }
    // Arrow key navigation
    if (key.rightArrow) {
      setSelectedIndex(prev => (prev + 1) % 9); // Loop through 0-8
      animation.stop();
    }
    if (key.leftArrow) {
      setSelectedIndex(prev => (prev - 1 + 9) % 9); // Loop through 8-0
      animation.stop();
    }
  });

  // Start/stop animation
  useEffect(() => {
    animation.start();
    return () => {
      animation.stop();
    };
  }, []);

  // Restart animation when group changes or selection changes
  useEffect(() => {
    // Clear any existing animation
    animation.stop();
    animation.start();
    
    
    return () => {
      animation.stop();
    };
  }, [currentGroup, selectedIndex]);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => animation.resize();
    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  const presenters = isGroupA ? GROUP_A : GROUP_B;

  return (
    <Box 
      flexDirection="column" 
      height={stdout.rows} 
      alignItems="center"
      justifyContent="center"
    >
      <Box marginBottom={1}>
        <Text bold color="green">
          Group {isGroupA ? 'A' : 'B'} - {isGroupA ? '7:00-7:45pm' : '7:45-8:30pm'}
        </Text>
      </Box>
      <Box marginBottom={1} width={130} alignItems="center">
        <Text bold color="white">     ENTRANCE</Text>
      </Box>

      <Box flexDirection="column">
        {/* Top section: Mainstage + Demo Area */}
        <Box>
          {/* Mainstage */}
          <Box 
            width={30} 
            height={24} 
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Text bold color="white">MAINSTAGE</Text>
          </Box>

          {/* Demo Area */}
          <Box 
            width={110} 
            height={24} 
            flexDirection="column"
            alignItems="center"
          >
            <Box marginY={1}>
              <Text bold color="white">DEMO AREA</Text>
            </Box>
            <Box flexDirection="column" gap={1}>
              <Box justifyContent="space-between" width={110}>
                <StationBox presenter={presenters[0]} isSelected={selectedIndex === 0} />
                <StationBox presenter={presenters[1]} isSelected={selectedIndex === 1} />
                <StationBox presenter={presenters[2]} isSelected={selectedIndex === 2} />
              </Box>
              <Box justifyContent="space-between" width={110}>
                <StationBox presenter={presenters[3]} isSelected={selectedIndex === 3} />
                <StationBox presenter={presenters[4]} isSelected={selectedIndex === 4} />
                <StationBox presenter={presenters[5]} isSelected={selectedIndex === 5} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom section: Food + Conference Area */}
        <Box>
          {/* Food Area */}
          <Box 
            width={30} 
            height={14} 
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Text bold color="white">FOOD</Text>
          </Box>

          {/* Conference Area */}
          <Box 
            width={110} 
            height={14} 
            flexDirection="column"
            alignItems="center"
          >
            <Box marginY={1}>
              <Text bold color="white">CONFERENCE ROOMS</Text>
            </Box>
            <Box justifyContent="space-between" width={105}>
              <BorderlessStationBox presenter={presenters[6]} isSelected={selectedIndex === 6} />
              <BorderlessStationBox presenter={presenters[7]} isSelected={selectedIndex === 7} />
              <BorderlessStationBox presenter={presenters[8]} isSelected={selectedIndex === 8} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default App; 