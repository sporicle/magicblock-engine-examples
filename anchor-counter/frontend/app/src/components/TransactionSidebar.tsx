import React from 'react';
import TransactionCard from './TransactionCard';
import './TransactionSidebar.css';

export interface Transaction {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  isEphemeral: boolean;
  timestamp: number;
}

interface TransactionSidebarProps {
  transactions: Transaction[];
  isDelegated: boolean;
  publicKey: string | null;
}

const TransactionSidebar: React.FC<TransactionSidebarProps> = ({ 
  transactions, 
  isDelegated, 
  publicKey 
}) => {
  return (
    <div className="transaction-sidebar">
      <div className="sidebar-status-section">
        <h3 className="text-lg font-semibold mb-1">Status</h3>
        <div className={`status-indicator ${isDelegated ? 'ephemeral' : 'solana'}`}>
          {isDelegated ? "Delegated to Ephemeral Rollup" : "On Solana Mainnet"}
        </div>
        
        {publicKey ? (
          <div className="wallet-info">
            <h4 className="text-sm font-semibold mt-3 mb-1">Connected Wallet</h4>
            <div className="wallet-address">
              {publicKey.substring(0, 6)}...{publicKey.substring(publicKey.length - 6)}
            </div>
          </div>
        ) : (
          <div className="wallet-info">
            <p className="text-sm text-gray-500 mt-3">Wallet not connected</p>
          </div>
        )}
      </div>
      
      <div className="sidebar-divider"></div>
      
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.signature}
              signature={tx.signature}
              status={tx.status}
              isEphemeral={tx.isEphemeral}
              timestamp={tx.timestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionSidebar; 