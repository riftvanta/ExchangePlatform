import React from 'react';
import DepositUsdtForm from '../components/DepositUsdtForm';
import { SectionContainer } from '../components/ui';

const DepositPage: React.FC = () => {
  return (
    <SectionContainer className="deposit-page">
      <div className="deposit-page-header">
        <h1>USDT Deposit</h1>
        <p>Deposit USDT to your account via TRC20 network</p>
      </div>
      
      <DepositUsdtForm />
    </SectionContainer>
  );
};

export default DepositPage; 