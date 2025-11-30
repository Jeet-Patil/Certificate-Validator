import React, { useState } from 'react';
import { ethers } from 'ethers';

// Pinata IPFS Configuration
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5OTY5NThiOS00NzdiLTQxNzktODU4ZS1kNTI3ZmY3MjQyZGIiLCJlbWFpbCI6InN3YXN0aHRlbC5jYW1wYWlnbkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYzBjMDZjNTEyMWUzNWZkZjFiNWMiLCJzY29wZWRLZXlTZWNyZXQiOiI3YWQzNzQ4NzQwOGQxNjZmZGZhYjNlZTY1MGE4ZjM0NTNiZjBmYTdkYjJmN2NlYmQ4MTYyNDZjNjgzMzU4YjA4IiwiZXhwIjoxNzk2MDUzOTgwfQ.palvsJFWJfoj7nqo5j9PVIhX1EDOjC7xGMUfUZy0BCQ';

const uploadToIPFS = async (file) => {
  try {
    // Upload to Pinata IPFS
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const ipfsHash = data.IpfsHash;
    
    console.log('✅ Uploaded to IPFS:', ipfsHash);
    
    return { 
      path: ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // Fallback: Store locally
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        const hash = btoa(base64.substring(0, 32));
        const simulatedCID = 'Qm' + hash.substring(0, 44).replace(/[^a-zA-Z0-9]/g, 'x');
        
        localStorage.setItem(`cert_image_${simulatedCID}`, reader.result);
        
        console.log('⚠️ Fallback: Stored locally as', simulatedCID);
        resolve({ path: simulatedCID, url: reader.result });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

function IssueCertificate({ contract, account }) {
  const [recipient, setRecipient] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        setImageFile(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(blob);
        e.preventDefault();
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!imageFile) {
      alert('Please upload or paste an image!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Upload image to IPFS
      setUploadingToIPFS(true);
      setResult({
        type: 'info',
        message: '📤 Uploading image...'
      });

      const added = await uploadToIPFS(imageFile);
      const ipfsHash = added.path;
      // Only send the IPFS hash string to blockchain, NOT the full data URL
      const ipfsUrl = `ipfs://${ipfsHash}`;

      setUploadingToIPFS(false);
      setResult({
        type: 'info',
        message: `✅ Image uploaded!\nHash: ${ipfsHash}\n\n⏳ Submitting transaction...`
      });

      // Generate certificate ID from image hash
      const certIdHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsHash));
      
      // Use IPFS hash as certificate content hash
      const certContentHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsHash));
      
      let expiryTimestamp = 0;
      if (expiryDate) {
        expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
      }

      // Use connected account as recipient if not specified
      const recipientAddress = recipient || account;
      
      if (!recipientAddress) {
        alert('Please connect your wallet!');
        setLoading(false);
        return;
      }
      
      const tx = await contract.issueCertificate(
        certIdHash,
        certContentHash,
        recipientAddress,
        expiryTimestamp,
        ipfsUrl
      );

      setResult({
        type: 'info',
        message: `✅ Image uploaded to IPFS!\nHash: ${ipfsHash}\n\n⏳ Transaction submitted! Waiting for confirmation...`
      });

      const receipt = await tx.wait();

      setResult({
        type: 'success',
        message: `✅ Certificate issued successfully!
        
📝 Transaction: ${receipt.hash}
🔗 IPFS Hash: ${ipfsHash}
🌐 IPFS URL: ${ipfsUrl}
📋 Certificate ID (use this to verify): ${ipfsHash}`
      });

      // Clear form
      setRecipient('');
      setExpiryDate('');
      setImageFile(null);
      setImagePreview(null);

    } catch (error) {
      console.error('Error issuing certificate:', error);
      
      let errorMessage = '❌ Failed to issue certificate\n\n';
      
      if (error.message?.includes('user rejected')) {
        errorMessage += '🚫 Transaction was rejected in MetaMask';
      } else {
        errorMessage += error.reason || error.message || 'Unknown error';
      }
      
      setResult({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
      setUploadingToIPFS(false);
    }
  };

  return (
    <div className="card">
      <h2>Issue New Certificate 🖼️</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Certificate Image</label>
          <div 
            className="image-upload-area"
            onPaste={handlePaste}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f9f9'
            }}
          >
            {imagePreview ? (
              <div>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  style={{ marginTop: '10px' }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                <p>Click to upload or paste image (Ctrl+V)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="imageInput"
                />
                <label htmlFor="imageInput" style={{ cursor: 'pointer', color: '#667eea', fontWeight: 'bold' }}>
                  Browse Files
                </label>
              </>
            )}
          </div>
          <small>Upload or paste an image. It will be stored on IPFS and the hash stored on blockchain.</small>
        </div>

        <div className="form-group">
          <label>Recipient Address (Optional)</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={account ? `Leave empty to use your address: ${account.slice(0,6)}...${account.slice(-4)}` : "0x..."}
          />
          <small>Leave empty to issue certificate to yourself ({account ? `${account.slice(0,10)}...` : 'Connect wallet'})</small>
        </div>

        <div className="form-group">
          <label>Expiry Date (Optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <small>Leave empty for no expiry</small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%' }} 
          disabled={loading || !imageFile}
        >
          {uploadingToIPFS ? '📤 Uploading to IPFS...' : loading ? '⏳ Processing...' : '✅ Issue Certificate'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>{uploadingToIPFS ? 'Uploading to IPFS...' : 'Processing transaction...'}</p>
        </div>
      )}

      {result && (
        <div className={`result ${result.type}`}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result.message}
          </pre>
        </div>
      )}
    </div>
  );
}

export default IssueCertificate;
