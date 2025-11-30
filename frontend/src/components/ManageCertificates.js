import React, { useState } from 'react';
import { ethers } from 'ethers';

function ManageCertificates({ contract }) {
  const [revokeCertId, setRevokeCertId] = useState('');
  const [newIssuer, setNewIssuer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRevoke = async (e) => {
    e.preventDefault();

    if (!contract) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const certIdHash = ethers.keccak256(ethers.toUtf8Bytes(revokeCertId));
      
      const tx = await contract.revokeCertificate(certIdHash);
      const receipt = await tx.wait();

      setResult({
        type: 'success',
        message: `✅ Certificate revoked successfully!\nTransaction: ${receipt.transactionHash}`
      });

      setRevokeCertId('');

    } catch (error) {
      console.error('Error revoking certificate:', error);
      setResult({
        type: 'error',
        message: `❌ Failed to revoke: ${error.reason || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();

    if (!contract) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const tx = await contract.addIssuer(newIssuer);
      const receipt = await tx.wait();

      setResult({
        type: 'success',
        message: `✅ Issuer added successfully!\nAddress: ${newIssuer}\nTransaction: ${receipt.transactionHash}`
      });

      setNewIssuer('');

    } catch (error) {
      console.error('Error adding issuer:', error);
      setResult({
        type: 'error',
        message: `❌ Failed to add issuer: ${error.reason || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Manage Certificates & Issuers</h2>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Revoke Certificate</h3>
        <form onSubmit={handleRevoke}>
          <div className="form-group">
            <label>Certificate ID (IPFS Hash)</label>
            <input
              type="text"
              value={revokeCertId}
              onChange={(e) => setRevokeCertId(e.target.value)}
              placeholder="QmX... (IPFS hash from certificate)"
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            Revoke Certificate
          </button>
        </form>
      </div>

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px solid #e5e7eb' }} />

      <div>
        <h3 style={{ marginBottom: '15px' }}>Add New Issuer</h3>
        <form onSubmit={handleAddIssuer}>
          <div className="form-group">
            <label>Issuer Address</label>
            <input
              type="text"
              value={newIssuer}
              onChange={(e) => setNewIssuer(e.target.value)}
              placeholder="0x..."
              required
            />
            <small>Only admins can add new issuers</small>
          </div>
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            Add Issuer
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {result && (
        <div className={`result-box ${result.type}`}>
          {result.message.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageCertificates;
