import React from 'react';
import './TransactionCard.css';

interface TransactionCardProps {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  isEphemeral: boolean;
  timestamp: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  signature,
  status,
  isEphemeral,
  timestamp,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 border-green-300';
      case 'failed':
        return 'bg-red-100 border-red-300';
    }
  };

  const explorerUrl = `https://explorer.solana.com/tx/${signature}${isEphemeral ? '?cluster=custom&customUrl=https%3A%2F%2Fdevnet.magicblock.app' : '?cluster=devnet'}`;
  const timeString = new Date(timestamp).toLocaleTimeString();

  return (
    <div className={`transaction-card ${getStatusColor()}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold">
          {isEphemeral ? 'Ephemeral' : 'Solana'}
        </span>
        <span className="text-xs">{timeString}</span>
      </div>
      <div className="signature" title={signature}>
        {signature.substring(0, 8)}...{signature.substring(signature.length - 8)}
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className={`status text-xs ${status === 'pending' ? 'text-yellow-700' : status === 'confirmed' ? 'text-green-700' : 'text-red-700'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <a 
          href={explorerUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View Explorer
        </a>
      </div>
    </div>
  );
};

export default TransactionCard; 