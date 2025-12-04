# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PyRevit-Blockchain is a comprehensive system that bridges Building Information Modeling (BIM) with blockchain technology. It extracts material data from Autodesk Revit models, calculates embodied carbon emissions for construction materials, and stores the results immutably on the Ethereum blockchain.

## Architecture

### Three-Component System

1. **PyRevit Extension** (`MyExtensions/`)
   - Runs inside Autodesk Revit as a PyRevit extension
   - Extracts material volumes from BIM models (walls, floors, columns, etc.)
   - Classifies materials into three categories: Concrete, Steel, CLT (Cross-Laminated Timber)
   - Calculates embodied carbon emissions using stage-based factors (A1-A3, A4, A5)
   - Exports data to JSON with integrity hash
   - Launches the Web3 uploader script automatically
   - Uses `config.json` for configurable paths

2. **Web3 Bridge Script** (`scripts/my_web3_script.py`)
   - Standalone Python script using web3.py
   - Reads emission data from JSON file
   - **Verifies data integrity** via SHA256 hash before upload
   - Connects to Ethereum node (configurable via environment variables)
   - Uses environment variables for sensitive configuration (addresses, private keys)
   - Uploads data to smart contract in two phases:
     - Stores complete project summary as JSON blob
     - Records individual material emissions with volume/emission calculations
   - Provides detailed transaction feedback and verification

3. **Web Frontend & Smart Contract** (`project/`)
   - React + TypeScript + Vite frontend for data visualization
   - Solidity smart contract (`EmbodiedCarbonLedgerV2.sol`) for immutable storage
   - Truffle for contract compilation and deployment
   - Uses environment variables for contract address configuration
   - Displays project analytics, material breakdowns, and global statistics

### Data Flow

```
Revit Model
    ↓ (PyRevit extracts volumes)
script.py
    ↓ (writes JSON with integrity hash to output/emissions.json)
    ↓ (file made READ-ONLY to prevent tampering)
my_web3_script.py
    ↓ (verifies hash, loads config from .env, connects via web3.py)
EmbodiedCarbonLedgerV2 Smart Contract
    ↓ (provides data via RPC)
React Frontend (loads contract address from env)
```

## Security Architecture

### Sensitive Configuration

**NEVER hardcode these values in source code:**
- Private keys
- Account addresses (unless for testing)
- Contract addresses (varies per deployment)

All sensitive configuration is handled through environment variables:

1. **Python Web3 Script**: Uses `.env` file (copy from `env.template`)
2. **React Frontend**: Uses `.env` file (copy from `env.template`)
3. **PyRevit Script**: Uses `config.json` for paths (no secrets stored)

### Data Integrity Verification

The system includes multiple layers of protection to prevent JSON manipulation:

**Layer 1: File Protection (Read-Only)**
- After export, `emissions.json` is automatically made **read-only**
- Prevents accidental or malicious modification
- PyRevit handles permissions automatically on re-export

**Layer 2: SHA256 Hash Verification**
1. **PyRevit exports** data with a `_data_hash` field containing the SHA256 hash
2. **Web3 script verifies** the hash before uploading to blockchain
3. If hash mismatch is detected, user is warned and must explicitly approve the upload

This dual protection prevents man-in-the-middle attacks where the emissions.json file might be modified between export and upload.

## Smart Contract Architecture

**EmbodiedCarbonLedgerV2** stores two types of records:

- **Material Records**: Individual material entries with calculated emissions
  - Material type (enum: Concrete=0, CLT=1, Steel=2)
  - Volume (scaled by 1e6 for precision)
  - Lifecycle stage emissions (A1-A3, A4, A5w)
  - Project ID and timestamp

- **JSON Records**: Complete project summaries as JSON blobs
  - Full emission data payload
  - Project metadata
  - Unclassified elements

Contract uses hardcoded emission factors and densities matching the Python calculations. Access control via `authorizedUploaders` mapping.

## Development Commands

### Automated Deployment (Recommended)

The easiest way to deploy is using the automated scripts:

```bash
# Option 1: One-click deployment (Windows)
# Just double-click deploy.bat in the project root

# Option 2: Interactive setup + deploy
cd project
npm install
npm run setup     # Interactive configuration wizard
npm run deploy    # Compiles and deploys

# Option 3: Quick deploy (if already configured)
cd project
npm run deploy
```

The deployment script automatically:
1. ✅ Compiles the smart contract
2. ✅ Deploys to Ganache
3. ✅ Updates `project/.env` with contract address
4. ✅ Updates `scripts/.env` with contract address
5. ✅ Copies ABI to `scripts/contract_abi.json`
6. ✅ Authorizes the uploader address

### Manual Commands

```bash
# Navigate to project directory
cd project

# Install dependencies
npm install

# Compile smart contracts only
npm run compile

# Deploy with Truffle directly (if needed)
truffle migrate --network development

# Start development frontend
npm run dev

# Build frontend for production
npm run build

# Lint TypeScript code
npm run lint
```

### Python Development

The PyRevit script (`script.py`) runs inside Revit's IronPython environment and has specific version compatibility handling:
- Uses `get_element_id_value()` helper for cross-version ElementId compatibility
- Enumerates multiple volume parameter candidates for Revit 2019-2026+
- Material classification via both name keywords and MaterialClass property
- Uses `ConfigLoader` class for configurable paths

The Web3 script (`my_web3_script.py`) requires:
- CPython 3.7+ (not IronPython)
- web3.py library
- python-dotenv library (optional, for .env file support)

```bash
# Install Python dependencies
pip install web3 python-dotenv
```

## Configuration Requirements

### Frontend Environment Variables

Create `project/.env` from `project/env.template`:
```
VITE_CONTRACT_ADDRESS="<deployed contract address>"
VITE_NETWORK_ID=5777
VITE_ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545
```

### Python Web3 Script Configuration

Create `scripts/.env` from `scripts/env.template`:
```
# Ethereum Node
ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545

# Contract (get from deployment output)
CONTRACT_ADDRESS=0x...

# Account (KEEP SECRET!)
SENDER_ADDRESS=0x...
PRIVATE_KEY=0x...

# Optional
CONTRACT_ABI_PATH=contract_abi.json
GAS_PRICE_GWEI=10
```

**⚠️ NEVER commit `.env` files to version control!**

### PyRevit Script Configuration

Edit `scripts/config.json` for paths:
```json
{
  "paths": {
    "project_root": "C:\\Users\\istiq\\Downloads\\PyRevit-Blockchain-main",
    "emissions_output": "C:\\Users\\istiq\\Downloads\\PyRevit-Blockchain-main\\output\\emissions.json",
    "python_executable": "C:\\Users\\istiq\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
    "web3_script": "C:\\Users\\istiq\\Downloads\\PyRevit-Blockchain-main\\scripts\\my_web3_script.py",
    "contract_abi": "contract_abi.json"
  },
  "security": {
    "enable_data_integrity_check": true,
    "protect_emissions_file": true
  }
}
```

**Note**: Update the paths if you move the project to a different location.

### Ganache Setup

The project expects Ganache running at:
- Host: `127.0.0.1`
- Port: `7545`
- Network ID: `5777` (or `*` for any)

## Key Implementation Details

### Material Classification Priority

The PyRevit script uses a priority system when elements have multiple materials:
1. CLT (highest priority - sustainable material)
2. Steel
3. Concrete (lowest priority)

This ensures elements with mixed materials are classified by their most significant structural material.

### Volume Extraction

Supports multiple Revit parameter types:
- `HOST_VOLUME_COMPUTED` (most host objects)
- `HOST_VOLUME_SCHEDULED` (Revit 2025+)
- `VOLUME` (family categories)
- `SOLID_VOLUME` (generic fallback)
- Name-based lookup via `LookupParameter("Volume")`

### Emission Factor Storage

Emission factors are duplicated between Python and Solidity for consistency:
- **Python**: `FACTOR` dict in `script.py` (kg CO₂e / kg)
- **Solidity**: Constants `F_*_A1A3`, `F_*_A4`, `F_*_A5w` (scaled by 1e6)

When modifying factors, update both locations.

### Volume Scaling

Volumes are scaled by 1e6 before blockchain storage to maintain precision with Solidity's uint256:
- Python: `int(volume_m3 * 1e6)`
- Solidity: Accepts scaled volumes, divides during calculations

## PyRevit Extension Structure

```
MyExtensions/MyExtension.extension/
└── Blockchain.tab/
    └── Send to Blockchain.panel/
        └── Submit to Blockchain.pushbutton/
            └── script.py
```

PyRevit auto-discovers extensions in this structure. The button appears in Revit's ribbon under the "Blockchain" tab.

## Testing Workflow

### Quick Start (Automated)

1. **Start Ganache** at 127.0.0.1:7545
2. **Run setup** (first time only):
   ```bash
   cd project
   npm install
   npm run setup  # Follow prompts to enter Ganache account details
   ```
3. **Deploy**: `npm run deploy` (or double-click `deploy.bat`)
4. **Start frontend**: `npm run dev`
5. **Test from Revit**:
   - Open Revit with PyRevit installed
   - Point PyRevit to: `C:\Users\istiq\Downloads\PyRevit-Blockchain-main\MyExtensions`
   - Open a model with structural elements
   - Click "Submit to Blockchain"
6. **Verify** in frontend and console output

### What the Automated Deploy Does

- ✅ Compiles contracts
- ✅ Deploys to Ganache
- ✅ Updates ALL .env files automatically
- ✅ Copies ABI to scripts folder
- ✅ Authorizes uploader address

No need to manually copy contract addresses or configure files!

## Common Issues

### "Configuration Error: CONTRACT_ADDRESS not configured"
Create a `.env` file from `env.template` and set the contract address.

### "Configuration Error: PRIVATE_KEY not configured"
Set up your account credentials in `scripts/.env`. Never commit this file!

### "Data hash mismatch" Warning
The emissions.json file was modified after export from Revit. Either:
- Re-export from Revit to get fresh data
- Manually approve the upload if you intentionally modified the file

### "NotAuthorised" Error
The sender address must be authorized in the smart contract. Run authorization via contract owner or include in deployment script.

### "Out of Gas" Errors
Large JSON payloads may exceed gas limits. The script creates minimal summaries for payloads >1000 chars. Adjust Ganache gas limit if needed.

### ElementId Compatibility
The `get_element_id_value()` helper handles Revit version differences (`.Value` vs `.IntegerValue`). Always use this helper rather than direct access.

### Material Not Found
Elements without recognized materials are logged in `unclassified_elements`. Check `KEYWORD_MAP` in `script.py` to add new material patterns.

## File Locations

All files are now organized within the project directory:

```
PyRevit-Blockchain-main/
├── MyExtensions/           # PyRevit extension (point Revit here)
├── output/                 # Emission data (protected, read-only)
│   └── emissions.json      # Generated by Revit, protected from tampering
├── scripts/                # Python scripts and configuration
│   ├── config.json         # Path configuration
│   ├── .env               # Sensitive config (create from env.template)
│   ├── env.template       # Template for .env
│   ├── my_web3_script.py  # Web3 uploader
│   └── contract_abi.json  # Contract ABI
├── project/                # React frontend
│   ├── .env               # Frontend env (create from env.template)
│   └── env.template       # Template for frontend .env
└── Revit Models/           # Sample Revit models
```

- **Emission Data Export**: `output/emissions.json` (protected read-only after export)
- **Configuration Files**:
  - `scripts/config.json` - Path configuration for PyRevit and Web3 script
  - `scripts/.env` - Sensitive config for Web3 script (auto-updated by deploy)
  - `project/.env` - Environment config for frontend (auto-updated by deploy)
- **Contract ABI**: `scripts/contract_abi.json` (auto-copied by deploy script)
- **Contract Artifacts**: `project/src/abis/*.json`
- **Deployment Scripts**:
  - `deploy.bat` - One-click Windows deployment
  - `setup.bat` - Interactive setup wizard (Windows)
  - `project/scripts/deploy.js` - Node.js deployment script
  - `project/scripts/setup.js` - Interactive setup script

## Security Checklist

Before deploying to production:

- [ ] Run `npm run setup` or `setup.bat` to configure accounts
- [ ] Verify `.env` files are NOT committed to git
- [ ] Verify data integrity checking is enabled in `config.json`
- [ ] Use a secure account with limited funds for uploading
- [ ] Test the full flow with `deploy.bat` in development first
- [ ] For production: use proper key management (not Ganache accounts)
