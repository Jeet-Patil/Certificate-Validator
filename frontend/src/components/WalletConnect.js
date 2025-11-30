import React from 'react';

function WalletConnect({ account, onConnect }) {
  return (
    <div className="wallet-section">
      <div className="wallet-info">
        <div className="wallet-status">
          {account && <div className="status-dot"></div>}
          <div>
            <strong>
              {account
                ? `${account.substring(0, 6)}...${account.substring(38)}`
                : 'Not Connected'}
            </strong>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={onConnect}
          disabled={!!account}
        >
          {account ? 'Connected' : 'Connect MetaMask'}
        </button>
      </div>
    </div>
  );
}

export default WalletConnect;
