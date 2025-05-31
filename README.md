# PyRevit-Blockchain

A comprehensive system for extracting material data from Revit BIM models, calculating embodied carbon emissions, and storing the results immutably on the Ethereum blockchain. This project bridges Building Information Modeling (BIM) with blockchain technology to create a transparent, tamper-proof ledger for construction industry carbon tracking.

## Prerequisites

- [Autodesk Revit](https://www.autodesk.com/products/revit/overview) (2019 or later)
- [PyRevit](https://github.com/eirannejad/pyRevit) installed and configured
- [Node.js](https://nodejs.org/) (v14.0.0 or later)
- [Truffle Suite](https://trufflesuite.com/)
- [MetaMask](https://metamask.io/) or another Web3 wallet
- Python 3.7 or later

## Installation

### 1. PyRevit Setup
1. Install PyRevit following the [official installation guide](https://github.com/eirannejad/pyRevit/wiki/Installation)
2. Clone this repository to your local machine
3. Copy the contents of the `MyExtensions` folder to your PyRevit extensions directory (typically located at `%appdata%\Roaming\pyRevit`)

### 2. Smart Contract Setup
1. Navigate to the project directory and install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following contents:
```
VITE_CONTRACT_ADDRESS="Enter Contract Address"
VITE_NETWORK_ID=5777
```

3. Compile and deploy the smart contracts:
```bash
npx truffle compile
truffle migrate --network your_network
npm run dev
```

### 3. Bridge Script Configuration
1. Locate the `web3_script.py` in the `scripts` folder
2. Update the following variables in the script:
   - `SENDER_ADDRESS`: Your Ethereum wallet address
   - `PRIVATE_KEY`: Your wallet's private key (Keep this secure!)
   - `CONTRACT_ADDRESS`: The deployed smart contract address

## Usage

1. Open Autodesk Revit
2. Look for the PyRevit-Blockchain toolbar in the Revit interface
3. Click on the provided icon to execute the bridge script
4. The script will:
   - Extract material data from your BIM model
   - Calculate embodied carbon emissions
   - Send the data to the Ethereum blockchain
   - Generate a transaction receipt

## Project Structure

```
PyRevit-Blockchain/
├── MyExtensions/        # PyRevit extension files
├── scripts/            # Bridge scripts and utilities
├── project/           # Smart contract and web3 integration
├── Revit Models/      # Sample Revit models
└── temp/              # Temporary files
```

## Security Considerations

- Never commit your `.env` file or expose your private keys
- Use environment variables for sensitive information
- Regularly update dependencies for security patches
- Backup your data before running the script on large models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

## Acknowledgments

- PyRevit community
- Ethereum development community
- Building Information Modeling (BIM) community
