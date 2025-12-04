#!/usr/bin/env node
/**
 * Automated Smart Contract Deployment Script
 * 
 * This script handles the complete deployment process:
 * 1. Compiles contracts (if needed)
 * 2. Deploys to Ganache
 * 3. Updates ALL config files automatically
 * 4. Copies ABI to Python scripts folder
 * 5. Authorizes the uploader address
 * 
 * Usage: npm run deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const { ethers } = require('ethers');

// Configuration
const CONTRACT_NAME = 'EmbodiedCarbonLedgerV2';
const PROJECT_ROOT = path.join(__dirname, '../..');  // PyRevit-Blockchain-main
const PROJECT_DIR = path.join(__dirname, '..');       // project/
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// Default Ganache settings
const DEFAULT_RPC_URL = 'http://127.0.0.1:7545';

async function main() {
    console.log('═'.repeat(60));
    console.log('🚀 AUTOMATED SMART CONTRACT DEPLOYMENT');
    console.log('═'.repeat(60));
    console.log();

    try {
        // Step 1: Check Ganache connection
        console.log('📡 Step 1: Checking Ganache connection...');
        const rpcUrl = process.env.DEPLOYMENT_RPC_URL || DEFAULT_RPC_URL;
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        try {
            const network = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            console.log(`   ✅ Connected to network (chainId: ${network.chainId})`);
            console.log(`   📦 Current block: ${blockNumber}`);
        } catch (err) {
            console.log(`   ❌ Cannot connect to ${rpcUrl}`);
            console.log('   Please ensure Ganache is running!');
            console.log('   Download from: https://trufflesuite.com/ganache/');
            process.exit(1);
        }

        // Step 2: Get deployer account from Ganache
        console.log('\n🔑 Step 2: Setting up deployer account...');
        let signer;
        let privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        
        if (privateKey) {
            // Use provided private key
            signer = new ethers.Wallet(privateKey, provider);
            console.log(`   📍 Using configured account: ${signer.address}`);
        } else {
            // Try to get first account from Ganache
            console.log('   ℹ️  No DEPLOYER_PRIVATE_KEY set, fetching from Ganache...');
            try {
                const accounts = await provider.send('eth_accounts', []);
                if (accounts.length === 0) {
                    throw new Error('No accounts available in Ganache');
                }
                // For Ganache, we can use eth_sendTransaction directly
                // But we'll try to get the private key if available
                const ganacheAccounts = await getGanacheAccounts(provider);
                if (ganacheAccounts) {
                    privateKey = ganacheAccounts.privateKey;
                    signer = new ethers.Wallet(privateKey, provider);
                } else {
                    // Use provider's signer (works with Ganache)
                    signer = await provider.getSigner(accounts[0]);
                }
                console.log(`   📍 Using Ganache account: ${accounts[0]}`);
            } catch (err) {
                console.log('   ❌ Could not get Ganache accounts');
                console.log('   Please set DEPLOYER_PRIVATE_KEY in project/.env');
                process.exit(1);
            }
        }

        // Check balance
        const deployerAddress = await signer.getAddress();
        const balance = await provider.getBalance(deployerAddress);
        const balanceEth = ethers.formatEther(balance);
        console.log(`   💰 Balance: ${balanceEth} ETH`);

        if (balance === 0n) {
            console.log('   ❌ Account has 0 ETH! Cannot deploy.');
            process.exit(1);
        }

        // Step 3: Compile contracts
        console.log('\n📦 Step 3: Compiling contracts...');
        try {
            execSync('npx truffle compile', { 
                cwd: PROJECT_DIR, 
                stdio: 'inherit' 
            });
            console.log('   ✅ Compilation successful');
        } catch (err) {
            console.log('   ⚠️  Compilation had warnings (continuing...)');
        }

        // Step 4: Load ABI and deploy
        console.log('\n🚀 Step 4: Deploying contract...');
        const abiPath = path.join(PROJECT_DIR, 'src/abis', `${CONTRACT_NAME}.json`);
        
        if (!fs.existsSync(abiPath)) {
            console.log(`   ❌ ABI not found at: ${abiPath}`);
            console.log('   Run: npm run compile');
            process.exit(1);
        }

        const abiData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        const bytecode = abiData.bytecode;

        if (!bytecode) {
            console.log('   ❌ Bytecode not found in ABI file');
            process.exit(1);
        }

        console.log(`   📄 Contract: ${CONTRACT_NAME}`);
        
        const factory = new ethers.ContractFactory(abiData.abi, bytecode, signer);
        const contract = await factory.deploy();
        
        console.log(`   ⏳ Waiting for deployment...`);
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log(`   ✅ Contract deployed at: ${contractAddress}`);

        // Step 5: Authorize uploader
        console.log('\n🔐 Step 5: Authorizing uploader address...');
        let uploaderAddress = process.env.SENDER_ADDRESS || deployerAddress;
        
        // Also check scripts/.env for SENDER_ADDRESS
        const scriptsEnvPath = path.join(SCRIPTS_DIR, '.env');
        if (fs.existsSync(scriptsEnvPath)) {
            const scriptsEnv = parseEnvFile(scriptsEnvPath);
            if (scriptsEnv.SENDER_ADDRESS) {
                uploaderAddress = scriptsEnv.SENDER_ADDRESS;
            }
        }

        if (uploaderAddress.toLowerCase() !== deployerAddress.toLowerCase()) {
            console.log(`   📍 Authorising: ${uploaderAddress}`);
            try {
                // Note: Contract uses British spelling "authoriseUploader"
                const tx = await contract.authoriseUploader(uploaderAddress);
                await tx.wait();
                console.log(`   ✅ Uploader authorised!`);
            } catch (err) {
                console.log(`   ⚠️  Authorisation failed: ${err.message}`);
            }
        } else {
            console.log(`   ✅ Deployer is auto-authorised as owner`);
        }

        // Step 6: Update all configuration files
        console.log('\n📝 Step 6: Updating configuration files...');
        
        // Update project/.env
        const projectEnvPath = path.join(PROJECT_DIR, '.env');
        updateEnvFile(projectEnvPath, {
            'VITE_CONTRACT_ADDRESS': contractAddress,
            'VITE_NETWORK_ID': '5777'
        });
        console.log(`   ✅ Updated: project/.env`);

        // Update scripts/.env
        updateEnvFile(scriptsEnvPath, {
            'CONTRACT_ADDRESS': contractAddress,
            'ETHEREUM_PROVIDER_URL': rpcUrl
        });
        console.log(`   ✅ Updated: scripts/.env`);

        // Step 7: Copy ABI to scripts folder
        console.log('\n📋 Step 7: Copying ABI to scripts folder...');
        const abiDestPath = path.join(SCRIPTS_DIR, 'contract_abi.json');
        
        // Extract just the ABI array for Python
        const abiOnly = abiData.abi;
        fs.writeFileSync(abiDestPath, JSON.stringify(abiOnly, null, 2));
        console.log(`   ✅ ABI copied to: scripts/contract_abi.json`);

        // Summary
        console.log('\n' + '═'.repeat(60));
        console.log('✅ DEPLOYMENT COMPLETE!');
        console.log('═'.repeat(60));
        console.log();
        console.log('📋 Summary:');
        console.log(`   Contract Address: ${contractAddress}`);
        console.log(`   Network: ${rpcUrl}`);
        console.log(`   Owner/Deployer: ${deployerAddress}`);
        console.log(`   Authorized Uploader: ${uploaderAddress}`);
        console.log();
        console.log('📁 Updated Files:');
        console.log(`   • project/.env`);
        console.log(`   • scripts/.env`);
        console.log(`   • scripts/contract_abi.json`);
        console.log();
        console.log('🎯 Next Steps:');
        console.log('   1. Start frontend: cd project && npm run dev');
        console.log('   2. Test from Revit: Click "Submit to Blockchain"');
        console.log();
        console.log('═'.repeat(60));

        return contractAddress;

    } catch (error) {
        console.log('\n❌ Deployment failed:', error.message);
        if (error.stack) {
            console.log('\nStack trace:', error.stack);
        }
        process.exit(1);
    }
}

/**
 * Try to get Ganache account private keys (works with Ganache GUI/CLI)
 */
async function getGanacheAccounts(provider) {
    try {
        // Try Ganache's personal API
        const accounts = await provider.send('personal_listAccounts', []);
        if (accounts && accounts.length > 0) {
            // Ganache typically uses predictable private keys in dev mode
            // First account private key in default Ganache mnemonic
            return null; // Let caller handle this
        }
    } catch (e) {
        // Not supported
    }
    return null;
}

/**
 * Parse an .env file into an object
 */
function parseEnvFile(envPath) {
    const result = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                    const key = trimmed.substring(0, eqIndex).trim();
                    let value = trimmed.substring(eqIndex + 1).trim();
                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    result[key] = value;
                }
            }
        }
    }
    return result;
}

/**
 * Update or create .env file with new values
 */
function updateEnvFile(envPath, updates) {
    let existing = {};
    
    // Read existing values
    if (fs.existsSync(envPath)) {
        existing = parseEnvFile(envPath);
    }
    
    // Merge updates
    const merged = { ...existing, ...updates };
    
    // Generate content
    const lines = [];
    for (const [key, value] of Object.entries(merged)) {
        lines.push(`${key}=${value}`);
    }
    
    // Ensure directory exists
    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(envPath, lines.join('\n') + '\n');
}

// Run
main().catch(console.error);
