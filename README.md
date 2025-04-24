# AIT TUI

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the application with tmux
tmux kill-session -t app 2>/dev/null; tmux new -ds app -f /dev/null 'npm run start'; tmux set-option -t app status off; tmux attach -t app
```