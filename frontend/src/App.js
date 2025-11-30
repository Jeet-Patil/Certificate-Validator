import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';
import WalletConnect from './components/WalletConnect';
import IssueCertificate from './components/IssueCertificate';
import VerifyCertificate from './components/VerifyCertificate';
import AllCertificates from './components/AllCertificates';
import './App.css';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [provider, setProvider] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');
  const [activeTab, setActiveTab] = useState('issue');

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  useEffect(() => {
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const networkInfo = await web3Provider.getNetwork();
      
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(contractInstance);
      setAccount(address);
      
      const chainId = Number(networkInfo.chainId);
      const networkName = chainId === 11155111 ? 'Sepolia' : 
                         chainId === 1 ? 'Mainnet' : 
                         `Chain ${chainId}`;
      setNetwork(networkName);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount('');
    setNetwork('');
  };

  return (
    <div className="App">
      <div className="network-badge">
        {network || 'Not Connected'}
      </div>

      <div className="container">
        <div className="header">
          <h1>🎓 Certificate Validator</h1>
          <p>Blockchain-based certificate issuance and verification</p>
        </div>

        <WalletConnect
          account={account}
          onConnect={connectWallet}
        />

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            Issue Certificate
          </button>
          <button
            className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            Verify Certificate
          </button>
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Certificates
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'issue' && (
            <IssueCertificate contract={contract} account={account} />
          )}
          {activeTab === 'verify' && (
            <VerifyCertificate contract={contract} />
          )}
          {activeTab === 'all' && (
            <AllCertificates contract={contract} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
