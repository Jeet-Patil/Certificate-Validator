# Certificate Validator - Ethereum Blockchain

A decentralized certificate validation system built on Ethereum blockchain. Upload certificate images to IPFS and store verification hashes on-chain for tamper-proof validation.

## 🌟 Features

- **Certificate Issuance**: Anyone can create certificates with images stored on IPFS
- **Certificate Verification**: Verify certificate authenticity using IPFS hash
- **IPFS Integration**: Real IPFS storage via Pinata for permanent certificate images
- **Certificate Revocation**: Revoke certificates when needed
- **Certificate Browsing**: View all issued certificates with images
- **Expiry Management**: Optional expiry dates for time-bound certificates
- **Gas Optimized**: Optimized smart contract for minimal gas costs

## 🛠️ Tech Stack

- **Smart Contract**: Solidity 0.8.20
- **Development**: Hardhat, TypeScript, TypeChain
- **Frontend**: React, ethers.js v6
- **Storage**: Pinata IPFS
- **Network**: Ethereum Sepolia Testnet

## 📋 Prerequisites

- Node.js v16 or higher
- MetaMask wallet
- Pinata account (free tier: https://pinata.cloud)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
cd frontend-react
npm install
cd ..
```

### 2. Set Up Environment

Create `.env` file:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### 3. Compile & Test

```bash
npm run compile
npm test
```

### 4. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Copy the deployed contract address to `frontend-react/src/config.js`

### 5. Configure Pinata

Update `frontend-react/src/components/IssueCertificate.js` with your Pinata JWT token

### 6. Run Frontend

```bash
cd frontend-react
npm start
```

Visit `http://localhost:3000`

## 🌐 Live Demo

**Frontend**: https://certificate-validator-nine.vercel.app/

Connect your MetaMask wallet to Sepolia testnet and start issuing/verifying certificates!

## 📝 Usage

### Issue Certificate
1. Connect MetaMask wallet
2. Go to "Issue Certificate" tab
3. Upload or paste certificate image
4. Add recipient address (optional - defaults to your address)
5. Set expiry date (optional)
6. Click "Issue Certificate"

### Verify Certificate
1. Go to "Verify Certificate" tab
2. Enter IPFS hash (e.g., `Qme2UBVTWXE6CxS7PEn2tY2hbUr7E8bAGDnwtnxCRVwwFP`)
3. View certificate details and image

### Browse All Certificates
1. Go to "All Certificates" tab
2. View all issued certificates with images

## 🏗️ Project Structure

```
├── contracts/              # Solidity smart contracts
│   └── CertificateValidator.sol
├── scripts/               # Deployment & utility scripts
│   ├── deploy.ts
│   └── checkCertificates.ts
├── test/                  # Contract tests
│   └── CertificateValidator.test.ts
├── frontend-react/        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── IssueCertificate.js
│   │   │   ├── VerifyCertificate.js
│   │   │   ├── AllCertificates.js
│   │   │   └── WalletConnect.js
│   │   ├── config.js
│   │   └── App.js
│   └── public/
└── typechain-types/       # Generated TypeScript types
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

22 tests covering:
- Certificate issuance
- Certificate verification
- Certificate revocation
- Expiry handling
- Certificate enumeration

## ⛽ Gas Optimization

The contract uses several gas optimization techniques:
- `string calldata` instead of `string memory` (~3,000 gas saved)
- `unchecked` blocks for safe operations (~100 gas saved)
- Efficient storage patterns

## 📄 Smart Contract

**Deployed on Sepolia**: `0xB55f334eab6795449554E96CF4614de4AaE1b846`

### Key Functions

- `issueCertificate()` - Create new certificate
- `verifyCertificate()` - Check validity
- `getCertificate()` - Get certificate details
- `revokeCertificate()` - Revoke certificate
- `getTotalCertificates()` - Get total count
- `getCertificateIdByIndex()` - Get certificate by index

## 🔒 Security

- On-chain storage of certificate hashes
- IPFS for immutable image storage
- No centralized control - anyone can issue/verify
- Transparent and auditable

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🐛 Known Issues

- Pinata free tier has rate limits
- Sepolia testnet requires test ETH (get from faucet)
- MetaMask required for frontend

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Ethereum, React, and IPFS**
