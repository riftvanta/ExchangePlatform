import React from 'react';
import WithdrawalForm from '../components/WithdrawalForm';
import { SectionContainer } from '../components/ui';

const WithdrawalPage: React.FC = () => {
  return (
    <SectionContainer className="withdrawal-page">
      <div className="withdrawal-page-header">
        <h1>USDT Withdrawal</h1>
        <p>Transfer your USDT to any external TRC20 wallet</p>
      </div>
      
      <WithdrawalForm />
    </SectionContainer>
  );
};

export default WithdrawalPage; 