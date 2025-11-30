import React, { useState } from 'react';
import { ethers } from 'ethers';

function VerifyCertificate({ contract }) {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [certDetails, setCertDetails] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    setResult(null);
    setCertDetails(null);

    try {
      // CertId is now the IPFS hash
      const certIdHash = ethers.keccak256(ethers.toUtf8Bytes(certId));

      const [isValid, reason] = await contract.verifyCertificate(certIdHash);

      if (isValid) {
        setResult({
          type: 'success',
          message: `✅ Certificate is Valid!\n${reason}`
        });

        // Get certificate details
        const cert = await contract.getCertificate(certIdHash);
        const issueDate = new Date(Number(cert.issueDate) * 1000).toLocaleString();
        const expiryDate = Number(cert.expiryDate) === 0
          ? 'No Expiry'
          : new Date(Number(cert.expiryDate) * 1000).toLocaleString();

        // Check if image is stored locally, otherwise use Pinata gateway
        const localImage = localStorage.getItem(`cert_image_${certId}`);
        let displayURI = localImage || cert.metadataURI;
        
        // If it's an ipfs:// URI, convert to Pinata gateway URL
        if (displayURI && displayURI.startsWith('ipfs://')) {
          const ipfsHash = displayURI.replace('ipfs://', '');
          displayURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        }
        
        setCertDetails({
          certId,
          hash: cert.certificateHash,
          issuer: cert.issuer,
          recipient: cert.recipient,
          issueDate,
          expiryDate,
          revoked: cert.revoked,
          metadataURI: displayURI
        });
      } else {
        setResult({
          type: 'error',
          message: `❌ Certificate is Invalid\n${reason}`
        });
      }

    } catch (error) {
      console.error('Error verifying certificate:', error);
      setResult({
        type: 'error',
        message: `❌ Error: ${error.reason || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Verify Certificate 🔍</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Certificate ID (IPFS Hash)</label>
          <input
            type="text"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="QmX... (IPFS hash from certificate issuance)"
            required
          />
          <small>Enter the certificate ID to verify</small>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Checking blockchain...</p>
        </div>
      )}

      {result && (
        <div className={`result-box ${result.type}`}>
          {result.message.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {certDetails && (
        <div className="cert-details">
          <h3>Certificate Details</h3>
          
          {certDetails.metadataURI && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img 
                src={certDetails.metadataURI} 
                alt="Certificate" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          
          <div className="detail-row">
            <div className="detail-label">Certificate ID (IPFS Hash):</div>
            <div className="detail-value" style={{ wordBreak: 'break-all' }}>{certDetails.certId}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Content Hash:</div>
            <div className="detail-value" style={{ wordBreak: 'break-all' }}>{certDetails.hash}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Issuer:</div>
            <div className="detail-value">{certDetails.issuer}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Recipient:</div>
            <div className="detail-value">{certDetails.recipient}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Issue Date:</div>
            <div className="detail-value">{certDetails.issueDate}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Expiry Date:</div>
            <div className="detail-value">{certDetails.expiryDate}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Status:</div>
            <div className="detail-value">
              <span className={`badge ${certDetails.revoked ? 'danger' : 'success'}`}>
                {certDetails.revoked ? 'Revoked' : 'Active'}
              </span>
            </div>
          </div>
          {certDetails.metadataURI && (
            <div className="detail-row">
              <div className="detail-label">IPFS URL:</div>
              <div className="detail-value">
                <a href={certDetails.metadataURI} target="_blank" rel="noopener noreferrer">
                  {certDetails.metadataURI}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VerifyCertificate;
