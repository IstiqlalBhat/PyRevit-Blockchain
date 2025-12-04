# Smart Contract Deployment Guide

This guide explains how to deploy the EmbodiedCarbonLedgerV2 smart contract without using Remix, using automated deployment scripts instead.

## Overview

The deployment process has been automated using ethers.js. The contract address, sender address, and private key are now managed through environment variables, allowing for secure and reproducible deployments.

## Setup Steps

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

This includes `ethers` and `dotenv` which are required for automated deployment.

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
# Network Configuration
VITE_RPC_URL=http://127.0.0.1:7545
VITE_CHAIN_ID=5777

# The contract address (will be updated after deployment)
VITE_CONTRACT_ADDRESS=0x1A6D72aCe3b3C4A238da071Af8555e1efCA34B87

# Deployment Account - REQUIRED
DEPLOYER_PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=0xYourDeployerAddressHere

# Network RPC (for deployment script)
DEPLOYMENT_RPC_URL=http://127.0.0.1:7545
DEPLOYMENT_CHAIN_ID=5777

# Auto-save contract address to .env after deployment
SAVE_DEPLOYMENT_ADDRESS=true
```

### 3. Get Deployer Private Key

If using **Ganache GUI**:
1. Start Ganache on your machine
2. Click on the key icon (🔑) next to any account in the Accounts list
3. Copy the private key
4. Paste it in `.env` as `DEPLOYER_PRIVATE_KEY`
5. Also copy the address and set `DEPLOYER_ADDRESS`

If using **Ganache CLI**:
```bash
ganache-cli --deterministic
```
The accounts and their private keys will be displayed in the terminal.

### 4. Compile Contracts

Before deploying, compile the Solidity contracts:

```bash
npm install
truffle compile
```

This generates the ABI files needed for deployment in `src/abis/`.

## Deployment

### Automated Deployment (Recommended)

Run the deployment script:

```bash
node scripts/deploy.js
```

The script will:
1. ✅ Validate environment variables
2. ✅ Check account balance
3. ✅ Load contract ABI
4. ✅ Deploy the contract
5. ✅ Wait for confirmation
6. ✅ Optionally save the address to `.env`

Example output:
```
🚀 Starting contract deployment...

📍 Network: http://127.0.0.1:7545
👤 Deployer Address: 0x1234567890123456789012345678901234567890
💰 Account Balance: 100 ETH

📦 Contract: EmbodiedCarbonLedgerV2
📄 ABI loaded from: src/abis/EmbodiedCarbonLedgerV2.json

⏳ Deploying contract...
✅ Contract deployed to: 0xABCD...EF01
📝 Transaction: 0x1234...5678

⏳ Waiting for confirmation...
✨ Contract confirmed at: 0xABCD...EF01

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DEPLOYMENT SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Manual Deployment (Alternative)

If you prefer to deploy manually using Truffle:

```bash
truffle migrate --network development
```

After deployment, manually update the `.env` file with the contract address.

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_RPC_URL` | Frontend RPC URL | `http://127.0.0.1:7545` |
| `VITE_CHAIN_ID` | Frontend Chain ID | `5777` |
| `VITE_CONTRACT_ADDRESS` | Deployed contract address | `0xABCD...` |
| `DEPLOYER_PRIVATE_KEY` | Private key for deployment | (Keep secret!) |
| `DEPLOYER_ADDRESS` | Deployer wallet address | `0x1234...` |
| `DEPLOYMENT_RPC_URL` | RPC URL for deployment | `http://127.0.0.1:7545` |
| `DEPLOYMENT_CHAIN_ID` | Chain ID for deployment | `5777` |
| `SAVE_DEPLOYMENT_ADDRESS` | Auto-update .env after deploy | `true` or `false` |

## Web3Context Integration

The `Web3Context.tsx` file now automatically loads the contract address from the environment variable:

```typescript
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
```

If the contract address is not set, a warning will be logged to the console.

## Troubleshooting

### "DEPLOYER_PRIVATE_KEY is not set in .env"
- Make sure you've created a `.env` file from `.env.example`
- Add your private key to `DEPLOYER_PRIVATE_KEY`

### "Insufficient funds! Deployer account has 0 ETH"
- Fund the deployer account with ETH
- In Ganache, you can transfer ETH from one of the funded accounts

### "ABI file not found"
- Run `truffle compile` to generate the ABI files
- Make sure the output directory is `src/abis/`

### Contract address not updating in .env
- Set `SAVE_DEPLOYMENT_ADDRESS=true` in `.env`
- Or manually update `VITE_CONTRACT_ADDRESS` with the deployed address

## Security Best Practices

⚠️ **IMPORTANT**: Never commit `.env` to version control!

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

For production:
- Use a secure key management system (e.g., AWS Secrets Manager, HashiCorp Vault)
- Never hardcode private keys
- Use HD wallets with derivation paths
- Implement multi-signature wallets for production contracts

## Next Steps

1. ✅ After successful deployment, start your development server:
   ```bash
   npm run dev
   ```

2. ✅ The frontend will automatically use the contract address from `.env`

3. ✅ Connect your wallet in the UI to interact with the contract

## Reverting Deployments

To redeploy to a fresh state:

1. Reset Ganache (in Ganache GUI, click the reset button)
2. Update `VITE_CONTRACT_ADDRESS` in `.env` to a new address or empty
3. Run the deployment script again

## Additional Resources

- [ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ganache Documentation](https://www.trufflesuite.com/ganache)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
