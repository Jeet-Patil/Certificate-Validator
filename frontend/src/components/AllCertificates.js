import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function AllCertificates({ contract }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCertificates = async () => {
    if (!contract) {
      setError('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get total number of certificates
      const count = await contract.getTotalCertificates();
      const total = Number(count);

      if (total === 0) {
        setCertificates([]);
        setLoading(false);
        return;
      }

      // Load all certificates
      const certs = [];
      for (let i = 0; i < total; i++) {
        try {
          const certId = await contract.getCertificateIdByIndex(i);
          const cert = await contract.getCertificate(certId);
          
          // Convert certId bytes32 to string
          const certIdString = certId.toString();
          
          // Extract IPFS hash from metadataURI for localStorage lookup
          let ipfsHashForLocal = '';
          if (cert.metadataURI && cert.metadataURI.startsWith('ipfs://')) {
            ipfsHashForLocal = cert.metadataURI.replace('ipfs://', '');
          }
          
          const localImage = localStorage.getItem(`cert_image_${ipfsHashForLocal}`);
          
          // Convert ipfs:// to Pinata gateway URL
          let displayURI = localImage || cert.metadataURI;
          if (displayURI && displayURI.startsWith('ipfs://')) {
            const ipfsHash = displayURI.replace('ipfs://', '');
            displayURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          }
          
          certs.push({
            id: certId,
            idString: certIdString,
            hash: cert.certificateHash,
            issuer: cert.issuer,
            recipient: cert.recipient,
            issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleString(),
            expiryDate: Number(cert.expiryDate) === 0 ? 'No Expiry' : new Date(Number(cert.expiryDate) * 1000).toLocaleString(),
            revoked: cert.revoked,
            metadataURI: displayURI,
            index: i
          });
        } catch (err) {
          console.error(`Error loading certificate ${i}:`, err);
        }
      }

      setCertificates(certs.reverse()); // Show newest first
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to load certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>All Certificates 📜</h2>
        <button 
          onClick={loadCertificates} 
          disabled={loading}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="result error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      )}

      {!loading && certificates.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p style={{ fontSize: '48px', margin: '0' }}>📭</p>
          <p>No certificates issued yet</p>
        </div>
      )}

      {!loading && certificates.length > 0 && (
        <>
          <div style={{ marginBottom: '15px', color: '#666' }}>
            <strong>Total Certificates:</strong> {certificates.length}
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {certificates.map((cert, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: cert.revoked ? '#fff5f5' : '#f9f9f9'
                }}
              >
                <div style={{ display: 'flex', gap: '15px' }}>
                  {/* Certificate Image */}
                  {cert.metadataURI && (
                    <div style={{ flexShrink: 0 }}>
                      <img 
                        src={cert.metadataURI}
                        alt="Certificate"
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #ddd'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Certificate Details */}
                  <div style={{ flex: 1, fontSize: '14px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span className={`badge ${cert.revoked ? 'danger' : 'success'}`}>
                        {cert.revoked ? '❌ Revoked' : '✅ Active'}
                      </span>
                      <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                        #{cert.index + 1}
                      </span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <strong>Certificate ID:</strong>{' '}
                      <code style={{ 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        wordBreak: 'break-all'
                      }}
                      onClick={() => copyToClipboard(cert.idString)}
                      title="Click to copy"
                      >
                        {cert.idString}
                      </code>
                    </div>

                    <div style={{ marginBottom: '5px' }}>
                      <strong>Issuer:</strong>{' '}
                      <code style={{ fontSize: '12px' }}>{cert.issuer.slice(0, 10)}...{cert.issuer.slice(-8)}</code>
                    </div>

                    <div style={{ marginBottom: '5px' }}>
                      <strong>Recipient:</strong>{' '}
                      <code style={{ fontSize: '12px' }}>{cert.recipient.slice(0, 10)}...{cert.recipient.slice(-8)}</code>
                    </div>

                    <div style={{ marginBottom: '5px' }}>
                      <strong>Issue Date:</strong> {cert.issueDate}
                    </div>

                    <div style={{ marginBottom: '5px' }}>
                      <strong>Expiry:</strong> {cert.expiryDate}
                    </div>

                    {cert.metadataURI && cert.metadataURI.startsWith('ipfs://') && (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href={`https://ipfs.io/ipfs/${cert.metadataURI.replace('ipfs://', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px' }}
                        >
                          🔗 View on IPFS
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AllCertificates;
