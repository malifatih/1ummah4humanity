'use client';

import { useState } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Lock, Unlock, Award, Loader2, Clock, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import Sidebar from '@/components/layout/Sidebar';
import RightSection from '@/components/layout/RightSection';
import { api } from '@/lib/api-client';
import type { Wallet, Transaction, TransactionType, TransactionStatus, StakeInfo, ApiResponse } from '@1ummah/shared';

interface WalletData {
  wallet: Wallet;
  stakes: StakeInfo[];
  rewardSummary: {
    totalEarned: string;
    thisMonth: string;
    postRewards: string;
    engagementRewards: string;
  };
}

function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case 'REWARD_POST': return <Award size={18} />;
    case 'REWARD_ENGAGEMENT': return <Award size={18} />;
    case 'STAKE': return <Lock size={18} />;
    case 'UNSTAKE': return <Unlock size={18} />;
    case 'TRANSFER_IN': return <ArrowDownLeft size={18} />;
    case 'TRANSFER_OUT': return <ArrowUpRight size={18} />;
    case 'ICO_PURCHASE': return <Coins size={18} />;
    default: return <WalletIcon size={18} />;
  }
}

function getTransactionLabel(type: TransactionType): string {
  switch (type) {
    case 'REWARD_POST': return 'Post Reward';
    case 'REWARD_ENGAGEMENT': return 'Engagement Reward';
    case 'STAKE': return 'Staked';
    case 'UNSTAKE': return 'Unstaked';
    case 'TRANSFER_IN': return 'Received';
    case 'TRANSFER_OUT': return 'Sent';
    case 'ICO_PURCHASE': return 'ICO Purchase';
    default: return 'Transaction';
  }
}

function getStatusIcon(status: TransactionStatus) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle2 size={14} className="status-completed" />;
    case 'PENDING': return <Clock size={14} className="status-pending" />;
    case 'FAILED': return <XCircle size={14} className="status-failed" />;
  }
}

function isPositiveTransaction(type: TransactionType): boolean {
  return ['REWARD_POST', 'REWARD_ENGAGEMENT', 'TRANSFER_IN', 'UNSTAKE', 'ICO_PURCHASE'].includes(type);
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakeAction, setStakeAction] = useState<'stake' | 'unstake'>('stake');

  const { data: walletData, isLoading, isError, error } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<ApiResponse<WalletData>>('/api/v1/wallet', { requireAuth: true }),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => api.get<ApiResponse<Transaction[]>>('/api/v1/wallet/transactions', { requireAuth: true }),
  });

  const stakeMutation = useMutation({
    mutationFn: (data: { amount: string; action: 'stake' | 'unstake' }) =>
      data.action === 'stake'
        ? api.post('/api/v1/wallet/stake', { amount: data.amount, lockPeriod: 30 }, { requireAuth: true })
        : api.post('/api/v1/wallet/unstake', { amount: data.amount }, { requireAuth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setStakeAmount('');
      setShowStakeModal(false);
    },
  });

  const wallet = walletData?.data?.wallet;
  const stakes = walletData?.data?.stakes ?? [];
  const rewardSummary = walletData?.data?.rewardSummary;
  const transactions: Transaction[] = txData?.data ?? [];

  const handleStakeSubmit = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    stakeMutation.mutate({ amount: stakeAmount, action: stakeAction });
  };

  const formatBalance = (amount: string | undefined) => {
    if (!amount) return '0.00';
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="layout-grid">
      <Sidebar />

      <main className="main-feed-container">
        <header className="feed-header glass-panel">
          <h2>Wallet</h2>
        </header>

        <div className="feed-content">
          {isLoading && (
            <div className="loading-state">
              <div className="skeleton-card large" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          )}

          {isError && (
            <div className="error-state">
              <h3>Could not load wallet</h3>
              <p>{error instanceof Error ? error.message : 'Something went wrong'}</p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {/* Balance Card */}
              <div className="balance-card">
                <div className="balance-header">
                  <WalletIcon size={24} />
                  <span className="balance-label">1UMMAH Balance</span>
                </div>
                <div className="balance-amount">
                  {formatBalance(wallet?.balance)}
                  <span className="token-symbol">1U</span>
                </div>
                <div className="balance-actions">
                  <button
                    className="btn-stake"
                    onClick={() => { setStakeAction('stake'); setShowStakeModal(true); }}
                  >
                    <Lock size={16} /> Stake
                  </button>
                  <button
                    className="btn-unstake"
                    onClick={() => { setStakeAction('unstake'); setShowStakeModal(true); }}
                  >
                    <Unlock size={16} /> Unstake
                  </button>
                </div>
              </div>

              {/* Staked Amount Card */}
              <div className="info-card">
                <div className="info-card-header">
                  <Lock size={20} />
                  <span>Staked Amount</span>
                </div>
                <div className="info-card-value">
                  {formatBalance(wallet?.stakedAmount)} <span className="token-symbol-sm">1U</span>
                </div>
                {stakes.filter((s) => s.status === 'ACTIVE').length > 0 && (
                  <div className="active-stakes">
                    {stakes.filter((s) => s.status === 'ACTIVE').map((stake) => (
                      <div key={stake.id} className="stake-row">
                        <span>{formatBalance(stake.amount)} 1U</span>
                        <span className="stake-apy">{stake.apy}% APY</span>
                        <span className="stake-period">{stake.lockPeriod}d lock</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reward Summary Card */}
              {rewardSummary && (
                <div className="info-card">
                  <div className="info-card-header">
                    <Award size={20} />
                    <span>Reward Summary</span>
                  </div>
                  <div className="reward-grid">
                    <div className="reward-item">
                      <span className="reward-label">Total Earned</span>
                      <span className="reward-value">{formatBalance(rewardSummary.totalEarned)} 1U</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-label">This Month</span>
                      <span className="reward-value">{formatBalance(rewardSummary.thisMonth)} 1U</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-label">Post Rewards</span>
                      <span className="reward-value">{formatBalance(rewardSummary.postRewards)} 1U</span>
                    </div>
                    <div className="reward-item">
                      <span className="reward-label">Engagement</span>
                      <span className="reward-value">{formatBalance(rewardSummary.engagementRewards)} 1U</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              <div className="transactions-section">
                <h3>Transaction History</h3>

                {txLoading && (
                  <div className="loading-state">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton-tx">
                        <div className="skeleton-avatar small" />
                        <div className="skeleton-content">
                          <div className="skeleton-line short" />
                          <div className="skeleton-line medium" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!txLoading && transactions.length === 0 && (
                  <div className="empty-tx">
                    <WalletIcon size={32} />
                    <p>No transactions yet</p>
                  </div>
                )}

                {transactions.map((tx) => (
                  <div key={tx.id} className="tx-row">
                    <div className={`tx-icon ${isPositiveTransaction(tx.type) ? 'positive' : 'negative'}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="tx-info">
                      <div className="tx-label-row">
                        <span className="tx-label">{getTransactionLabel(tx.type)}</span>
                        {getStatusIcon(tx.status)}
                      </div>
                      {tx.description && <p className="tx-desc">{tx.description}</p>}
                      <span className="tx-time">
                        {formatDistanceToNowStrict(new Date(tx.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <span className={`tx-amount ${isPositiveTransaction(tx.type) ? 'positive' : 'negative'}`}>
                      {isPositiveTransaction(tx.type) ? '+' : '-'}{formatBalance(tx.amount)} 1U
                    </span>
                  </div>
                ))}
              </div>

              {/* Stake/Unstake Modal */}
              {showStakeModal && (
                <div className="modal-overlay" onClick={() => setShowStakeModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>{stakeAction === 'stake' ? 'Stake Tokens' : 'Unstake Tokens'}</h3>
                    <p className="modal-desc">
                      {stakeAction === 'stake'
                        ? 'Lock your 1UMMAH tokens to earn rewards. Staked tokens cannot be transferred.'
                        : 'Withdraw your staked tokens. Unstaking may take up to 24 hours to process.'}
                    </p>
                    <div className="form-group">
                      <label>Amount (1U)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <span className="available-label">
                        Available: {formatBalance(stakeAction === 'stake' ? wallet?.balance : wallet?.stakedAmount)} 1U
                      </span>
                    </div>
                    <div className="modal-actions">
                      <button className="btn-cancel" onClick={() => setShowStakeModal(false)}>
                        Cancel
                      </button>
                      <button
                        className="btn-primary btn-confirm"
                        onClick={handleStakeSubmit}
                        disabled={stakeMutation.isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      >
                        {stakeMutation.isPending ? (
                          <><Loader2 size={16} className="spin-icon" /> Processing...</>
                        ) : (
                          stakeAction === 'stake' ? 'Stake' : 'Unstake'
                        )}
                      </button>
                    </div>
                    {stakeMutation.isError && (
                      <p className="form-error">
                        {stakeMutation.error instanceof Error ? stakeMutation.error.message : 'Transaction failed'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <RightSection />

      <style jsx>{`
        .feed-header h2 {
          padding: 1rem 0;
          font-size: 1.25rem;
        }
        .balance-card {
          margin: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, hsl(210, 80%, 25%), hsl(210, 80%, 15%));
          border-radius: var(--radius-lg);
          border: 1px solid hsla(210, 100%, 60%, 0.3);
        }
        .balance-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: hsla(210, 100%, 80%, 0.8);
          margin-bottom: 0.75rem;
        }
        .balance-label {
          font-size: 0.9rem;
          font-weight: 600;
        }
        .balance-amount {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-text-main);
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .token-symbol {
          font-size: 1.1rem;
          color: var(--color-brand);
          font-weight: 600;
        }
        .token-symbol-sm {
          font-size: 0.85rem;
          color: var(--color-brand);
          font-weight: 600;
        }
        .balance-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .btn-stake, .btn-unstake {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
        }
        .btn-stake {
          background: var(--color-brand);
          color: white;
        }
        .btn-stake:hover {
          opacity: 0.9;
        }
        .btn-unstake {
          background: transparent;
          color: var(--color-text-main);
          border: 1px solid var(--color-border);
        }
        .btn-unstake:hover {
          background: var(--color-bg-card);
        }
        .info-card {
          margin: 0.75rem 1rem;
          padding: 1.25rem;
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        .info-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-secondary);
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }
        .info-card-value {
          font-size: 1.75rem;
          font-weight: 800;
        }
        .active-stakes {
          margin-top: 1rem;
          border-top: 1px solid var(--color-border);
          padding-top: 0.75rem;
        }
        .stake-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
          font-size: 0.85rem;
        }
        .stake-apy {
          color: hsl(140, 80%, 50%);
          font-weight: 600;
        }
        .stake-period {
          color: var(--color-text-muted);
        }
        .reward-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .reward-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .reward-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .reward-value {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .transactions-section {
          padding: 1rem;
        }
        .transactions-section h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--color-border);
        }
        .tx-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .tx-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tx-icon.positive {
          background: hsla(140, 80%, 50%, 0.12);
          color: hsl(140, 80%, 50%);
        }
        .tx-icon.negative {
          background: hsla(210, 80%, 50%, 0.12);
          color: hsl(210, 80%, 60%);
        }
        .tx-info {
          flex: 1;
          min-width: 0;
        }
        .tx-label-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .tx-label {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .tx-desc {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.1rem;
        }
        .tx-time {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        .tx-amount {
          font-weight: 700;
          font-size: 0.95rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .tx-amount.positive {
          color: hsl(140, 80%, 50%);
        }
        .tx-amount.negative {
          color: var(--color-text-secondary);
        }
        .empty-tx {
          text-align: center;
          padding: 2.5rem;
          color: var(--color-text-muted);
        }
        .empty-tx p {
          margin-top: 0.5rem;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          width: 90%;
          max-width: 420px;
        }
        .modal-content h3 {
          font-size: 1.15rem;
          margin-bottom: 0.5rem;
        }
        .modal-desc {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.4;
          margin-bottom: 1.25rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 0.85rem;
          margin-bottom: 0.4rem;
          color: var(--color-text-secondary);
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-card);
          color: var(--color-text-main);
          font-size: 1.1rem;
          font-family: inherit;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--color-brand);
        }
        .available-label {
          display: block;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-top: 0.35rem;
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.25rem;
        }
        .btn-cancel {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-main);
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-cancel:hover {
          background: var(--color-bg-card);
        }
        .btn-confirm {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.25rem;
          font-size: 0.85rem;
        }
        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .form-error {
          color: hsl(0, 80%, 60%);
          font-size: 0.8rem;
          margin-top: 0.75rem;
        }
        .error-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--color-text-muted);
        }
        .error-state h3 {
          font-size: 1.5rem;
          color: hsl(0, 80%, 60%);
          margin-bottom: 0.5rem;
        }
        .loading-state {
          padding: 1rem;
        }
        .skeleton-card {
          height: 100px;
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          margin-bottom: 0.75rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-card.large {
          height: 180px;
        }
        .skeleton-tx {
          display: flex;
          gap: 0.75rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .skeleton-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-bg-card);
          animation: pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .skeleton-avatar.small {
          width: 36px;
          height: 36px;
        }
        .skeleton-content { flex: 1; }
        .skeleton-line {
          height: 14px;
          background: var(--color-bg-card);
          border-radius: 4px;
          margin-bottom: 0.5rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 70%; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
