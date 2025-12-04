# PyRevit-Blockchain

A comprehensive system for extracting material data from Revit BIM models, calculating embodied carbon emissions, and storing the results immutably on the Ethereum blockchain. This project bridges Building Information Modeling (BIM) with blockchain technology to create a transparent, tamper-proof ledger for construction industry carbon tracking.

## Features

- **Material Extraction**: Automatically extracts volumes for Concrete, Steel, and CLT from Revit models
- **Carbon Calculation**: Calculates embodied carbon emissions across lifecycle stages (A1-A3, A4, A5)
- **Blockchain Storage**: Immutable storage on Ethereum with project tracking
- **Cross-Version Support**: Compatible with Revit 2019-2026+
- **Data Integrity**: SHA256 hash verification and read-only file protection
- **Web Dashboard**: React-based analytics and visualization interface
- **One-Click Deployment**: Automated setup and configuration scripts

## Prerequisites

- [Autodesk Revit](https://www.autodesk.com/products/revit/overview) (2019 or later)
- [PyRevit](https://github.com/eirannejad/pyRevit) installed and configured
- [Node.js](https://nodejs.org/) (v14.0.0 or later)
- [Ganache](https://trufflesuite.com/ganache/) (local Ethereum blockchain)
- Python 3.7 or later with pip

## Quick Start

### Option 1: One-Click Setup (Windows)

1. **Clone the repository**
   ```bash
   git clone https://github.com/IstiqlalBhat/PyRevit-Blockchain.git
   cd PyRevit-Blockchain
   ```

2. **Start Ganache**
   - Launch Ganache and ensure it's running at `127.0.0.1:7545`
   - Note down one account address and its private key

3. **Run setup wizard**
   ```bash
   setup.bat
   ```
   Follow the prompts to configure your Ganache account details.

4. **Deploy everything**
   ```bash
   deploy.bat
   ```
   This will automatically:
   - Install dependencies
   - Compile and deploy the smart contract
   - Update all configuration files
   - Copy the contract ABI
   - Authorize your account

5. **Configure PyRevit**
   - Edit `scripts/config.json` and update paths to match your system
   - Point PyRevit to the `MyExtensions` folder

6. **Start the frontend**
   ```bash
   cd project
   npm run dev
   ```

### Option 2: Manual Setup

#### 1. Install Python Dependencies
```bash
pip install web3 python-dotenv
```

#### 2. Install Node Dependencies
```bash
cd project
npm install
```

#### 3. Configure Environment Variables

Create `scripts/.env` from template:
```bash
cd scripts
cp env.template .env
```

Edit `scripts/.env`:
```
ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=<address from deployment>
SENDER_ADDRESS=<your Ganache account address>
PRIVATE_KEY=<your Ganache account private key>
```

Create `project/.env` from template:
```bash
cd project
cp env.template .env
```

Edit `project/.env`:
```
VITE_CONTRACT_ADDRESS=<address from deployment>
VITE_NETWORK_ID=5777
VITE_ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545
```

#### 4. Deploy Smart Contract

```bash
cd project
npx truffle compile
npx truffle migrate --network development
```

Copy the deployed contract address and update both `.env` files.

#### 5. Configure PyRevit Script

Edit `scripts/config.json` and update:
- `paths.project_root`: Path to this repository
- `paths.emissions_output`: Where emissions.json will be saved
- `paths.python_executable`: Path to your Python installation
- `paths.web3_script`: Path to my_web3_script.py

#### 6. Setup PyRevit Extension

1. Open PyRevit settings in Revit
2. Add custom extension path: `<repo-path>/MyExtensions`
3. Reload PyRevit

#### 7. Start the Frontend

```bash
cd project
npm run dev
```

## Usage

### Extract and Upload Emission Data

1. **Open Revit** with a BIM model containing structural elements (walls, floors, columns, etc.)

2. **Click the PyRevit-Blockchain button** in the Revit ribbon under the "Blockchain" tab

3. **Review the console output** showing:
   - Materials found and classified
   - Volumes and masses calculated
   - Embodied carbon emissions per material
   - Transaction confirmations

4. **Check the data**:
   - Emissions data saved to `output/emissions.json`
   - File is automatically protected (read-only)
   - Data includes SHA256 hash for integrity verification

5. **View in dashboard**:
   - Open `http://localhost:5173` (or the URL shown by `npm run dev`)
   - Browse projects, analytics, and material breakdowns

### Security Features

The system includes multiple protection layers:

- **File Protection**: Emissions JSON is automatically made read-only after export
- **Hash Verification**: SHA256 hash computed on export and verified before upload
- **Environment Variables**: All sensitive data (keys, addresses) stored in `.env` files
- **No Hardcoding**: Contract addresses and credentials never hardcoded in source

## Project Structure

```
PyRevit-Blockchain/
├── MyExtensions/              # PyRevit extension
│   └── MyExtension.extension/
│       └── Blockchain.tab/
│           └── Submit to Blockchain.pushbutton/
│               └── script.py  # Main Revit extraction script
├── scripts/                   # Python Web3 bridge
│   ├── my_web3_script.py     # Blockchain uploader
│   ├── config.json           # Path configuration
│   ├── env.template          # Environment template
│   └── contract_abi.json     # Smart contract ABI
├── project/                   # Frontend and smart contracts
│   ├── src/
│   │   ├── contracts/        # Solidity contracts
│   │   │   └── EmbodiedCarbonLedgerV2.sol
│   │   ├── components/       # React components
│   │   ├── pages/            # Application pages
│   │   └── abis/             # Compiled contract ABIs
│   ├── scripts/
│   │   ├── deploy.js         # Automated deployment
│   │   └── setup.js          # Interactive setup wizard
│   └── package.json          # Node dependencies
├── output/                    # Emission data exports
│   └── emissions.json        # Generated by Revit (protected)
├── Revit Models/             # Sample BIM models
├── deploy.bat                # One-click deployment (Windows)
└── setup.bat                 # Setup wizard (Windows)
```

## Troubleshooting

### "NotAuthorised" Error
- Your account address must be authorized in the smart contract
- Run `npm run deploy` which automatically authorizes the configured account
- Or manually authorize via contract owner

### "Out of Gas" Errors
- Large JSON payloads may exceed gas limits
- The script automatically creates minimal summaries for large data
- Increase Ganache's gas limit if needed: Settings → Chain → Gas Limit

### "Data hash mismatch" Warning
- The emissions.json file was modified after export
- Re-export from Revit to get fresh data with correct hash
- Or manually approve upload if modification was intentional

### Material Not Classified
- Check `KEYWORD_MAP` in `script.py` to add material patterns
- Elements without recognized materials appear in `unclassified_elements`
- Update material names in Revit or add keywords to the mapping

### PyRevit Button Not Showing
- Verify PyRevit extension path includes the `MyExtensions` folder
- Reload PyRevit: PyRevit → Settings → Reload
- Check PyRevit console for any loading errors

## Development

### Running Tests
```bash
cd project
npx truffle test
```

### Linting
```bash
cd project
npm run lint
```

### Building for Production
```bash
cd project
npm run build
```

## Security Best Practices

- **Never commit `.env` files** - they contain private keys
- **Use test accounts only** - don't use real funds in Ganache
- **Verify data integrity** - the system automatically checks file hashes
- **Regular updates** - keep dependencies updated for security patches
- **Backup models** - always backup Revit files before running scripts

## Materials Supported

The system recognizes and calculates emissions for:

- **Concrete**: Cast-in-place, precast
- **Steel**: Structural steel, rebar
- **CLT**: Cross-laminated timber, engineered wood

Emission factors are based on industry standards for:
- **A1-A3**: Product stage (extraction, transport, manufacturing)
- **A4**: Transport to site
- **A5**: Construction/installation

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## Acknowledgments

- PyRevit community for the excellent Revit automation framework
- Ethereum and Truffle Suite for blockchain development tools
- Open-source BIM and sustainability communities
