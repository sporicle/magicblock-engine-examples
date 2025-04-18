#!/bin/bash
set -e

echo "Building the Anchor project..."
anchor build

echo "Deploying the Painting program to Solana..."
anchor deploy --provider.cluster devnet --program-name anchor-counter

echo "Backend deployment complete!" 