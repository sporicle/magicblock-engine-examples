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
}

const TransactionSidebar: React.FC<TransactionSidebarProps> = ({ transactions }) => {
  return (
    <div className="transaction-sidebar">
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