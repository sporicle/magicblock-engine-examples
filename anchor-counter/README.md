# Collaborative Painting on Solana

A decentralized collaborative painting application built on Solana using Ephemeral Rollups. This application allows multiple users to paint on a shared 20x20 canvas, with changes being recorded on the blockchain.

## Features

- 20x20 pixel canvas for collaborative artwork
- 8 color palette selection
- Support for Ephemeral Rollups for fast, low-cost transactions
- Anyone can paint on the canvas - no restrictions
- Seamless delegation and undelegation to/from Ephemeral Rollups

## Technical Stack

- **Backend**: Solana program written in Rust with Anchor framework
- **Frontend**: React application with TypeScript
- **Integration**: Solana Web3.js, Anchor Client, and Ephemeral Rollups SDK

## Getting Started

### Prerequisites

- Solana CLI tools
- Anchor framework
- Node.js v14+ and npm/yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anchor-counter
```

2. Install dependencies:
```bash
npm install
cd frontend/app
npm install
cd ../..
```

### Local Development

1. Start a local Solana validator:
```bash
solana-test-validator
```

2. Build and deploy the Solana program:
```bash
anchor build
anchor deploy
```

3. Update the program ID:
   - Copy the program ID from the deployment output
   - Update it in `lib.rs` and `Anchor.toml`

4. Run the frontend:
```bash
cd frontend/app
npm start
```

5. The app should now be running at `http://localhost:3000`

## Deployment

### Deploying the Solana Program

You can use the provided deploy script:

```bash
sh sh/deploy-backend.sh
```

### Generating a New Program ID and Deploying

If you need to create a new program ID and deploy with it, use the deploy-new script:

```bash
sh sh/deploy-new.sh
```

If you already have an existing keypair and want to overwrite it, use the --force flag:

```bash
sh sh/deploy-new.sh --force
```

This script will:
1. Generate a new keypair for the program
2. Update all references to the program ID in the codebase
3. Build and deploy the program with the new ID
4. Alert you about any potential places where manual updates might be needed

### Deploying the Frontend

You can use the provided deploy script and choose your preferred hosting provider:

```bash
sh sh/deploy-frontend.sh
```
Edit the script to uncomment your preferred hosting method (GitHub Pages, Vercel, or Netlify).

## Using the App

1. Connect your Solana wallet using the button in the top-right corner
2. Initialize the canvas (if it hasn't been initialized yet)
3. Select a color from the palette
4. Click on any pixel to paint it with the selected color
5. To use Ephemeral Rollups for faster transactions:
   - Click "Delegate to Ephemeral" button
   - Paint as usual with faster transactions
   - When done, click "Undelegate" to commit changes back to Solana mainnet

## Architecture

The application consists of two main components:

### Solana Program
- Manages the 20x20 canvas state
- Handles pixel painting operations
- Supports delegation to Ephemeral Rollups

### Frontend
- React-based UI for the canvas and color selection
- Connects to Solana via wallet adapters
- Displays real-time changes from the blockchain

## License

This project is licensed under [MIT License](LICENSE).

## Acknowledgements

- This project is built using [Anchor](https://project-serum.github.io/anchor/)
- Based on the [Ephemeral Rollups SDK](https://magicblock.gg/) by Magicblock
