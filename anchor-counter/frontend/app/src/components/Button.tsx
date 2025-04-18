import React from 'react';

type ButtonProps = {
    title?: string;
    onClick: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ title, onClick, disabled = false, children }) => {
    return (
        <button
            onClick={() => !disabled && onClick()}
            disabled={disabled}
            style={{
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? '#666' : '#fff',
                transition: 'all 0.3s ease',
                padding: '8px 16px',
                borderRadius: '4px',
                background: '#4e44ce',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.9rem'
            }}
        >
            {children || title}
        </button>
    );
};

export default Button;