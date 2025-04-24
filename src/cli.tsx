#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './App.js';

const cli = meow(`
  Usage
    $ ait-tui [options]

  Options
    --group, -g  Specify group to display (A or B) [Default: A]

  Examples
    $ ait-tui --group A
    $ ait-tui --group B
`, {
  importMeta: import.meta,
  flags: {
    group: {
      type: 'string',
      shortFlag: 'g',
      default: 'A'
    }
  }
});

// Create a persistent render instance
const { waitUntilExit } = render(<App group={cli.flags.group} />);

// Keep the process running until the app exits
waitUntilExit().catch(() => {
  process.exit(0);
}); 