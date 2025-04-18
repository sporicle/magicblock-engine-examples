#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

# Check for --force flag
FORCE_FLAG=""
if [ "$1" == "--force" ]; then
    FORCE_FLAG="--force"
    echo "Force flag detected, will overwrite existing keypair if present."
fi

echo "Creating new keypair for the anchor-counter program..."
# Generate new keypair
solana-keygen new --no-bip39-passphrase -o target/deploy/anchor_counter-keypair.json $FORCE_FLAG

# Get the new program ID
NEW_PROGRAM_ID=$(solana-keygen pubkey target/deploy/anchor_counter-keypair.json)
echo "New program ID: $NEW_PROGRAM_ID"

# Update declare_id in the program
echo "Updating declare_id in the program..."
sed -i '' "s/declare_id!(\"[^\"]*\");/declare_id!(\"$NEW_PROGRAM_ID\");/" programs/anchor-counter/src/lib.rs

# Update Anchor.toml with the new program ID
echo "Updating Anchor.toml..."
sed -i '' "s/anchor_counter = \".*\"/anchor_counter = \"$NEW_PROGRAM_ID\"/" Anchor.toml

# Check if frontend/app/src/App.tsx exists and update the PAINTING_PROGRAM constant
if [ -f "frontend/app/src/App.tsx" ]; then
    echo "Updating frontend App.tsx..."
    sed -i '' "s/const PAINTING_PROGRAM = new PublicKey(\".*\")/const PAINTING_PROGRAM = new PublicKey(\"$NEW_PROGRAM_ID\")/" frontend/app/src/App.tsx
fi

# # Check for test files that might reference the program ID
# if [ -f "tests/anchor-counter.ts" ]; then
#     echo "Checking test files for program ID references..."
#     # We don't directly replace here as test files might use the program differently
#     # Instead, we alert the developer to check the file
#     grep -l "852a53jomx7dGmkpbFPGXNJymRxywo3WsH1vusNASJRr" tests/anchor-counter.ts >/dev/null 2>&1
#     if [ $? -eq 0 ]; then
#         echo "⚠️  Warning: Found references to the old program ID in tests/anchor-counter.ts"
#         echo "⚠️  You may need to manually update them."
#     fi
# fi

# Build the program
echo "Building program..."
anchor build

# Deploy the program
echo "Deploying program..."
anchor deploy

echo "Program successfully deployed with new ID: $NEW_PROGRAM_ID"
echo "Please make sure to update any other hardcoded references to the program ID if necessary."

echo "Uploading IDL"
anchor idl init -f target/idl/anchor_counter.json $NEW_PROGRAM_ID

# Print a reminder for the frontend
if [ -f "frontend/app/src/App.tsx" ]; then
    echo "Don't forget to rebuild the frontend with the new program ID!"
fi 