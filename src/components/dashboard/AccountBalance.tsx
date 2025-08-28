import { Card, Statistic, Spin } from "antd";
import { useEffect, useState } from "react";
import { useSelectedAccount } from "../../stores/accountSelectorStore";
import { useAuthStore } from "../../stores/authStore";
import { getAccountWithTransactions } from "../../services/accountsService";
import { useTotalPnl } from "../../stores/dashboardStore";
import type { AccountTransaction } from "../../types/trade";

export default function AccountBalance() {
  const [isLoading, setIsLoading] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const selectedAccount = useSelectedAccount();
  const { user } = useAuthStore();
  const totalPnl = useTotalPnl();

  // Calculate total balance: deposits - withdrawals + total PnL
  const totalBalance = totalDeposits - totalWithdrawals + totalPnl;

  // Fetch account transactions when selected account changes
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!selectedAccount?.id || !user?.uid) {
        setTotalDeposits(0);
        setTotalWithdrawals(0);
        return;
      }

      setIsLoading(true);
      try {
        const accountData = await getAccountWithTransactions(
          selectedAccount.id
        );

        if (accountData) {
          const { transactions } = accountData;

          // Calculate total deposits and withdrawals
          const deposits = transactions
            .filter((t: AccountTransaction) => t.type === "deposit")
            .reduce((sum: number, t: AccountTransaction) => sum + t.amount, 0);

          const withdrawals = transactions
            .filter((t: AccountTransaction) => t.type === "withdrawal")
            .reduce((sum: number, t: AccountTransaction) => sum + t.amount, 0);

          setTotalDeposits(deposits);
          setTotalWithdrawals(withdrawals);
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
        setTotalDeposits(0);
        setTotalWithdrawals(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [selectedAccount?.id, user?.uid]);

  if (isLoading) {
    return (
      <Card style={{ height: "120px" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin size="small" />
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ height: "120px" }}>
      <Statistic
        title="Account Balance"
        value={totalBalance}
        precision={2}
        suffix="USD"
      />
    </Card>
  );
}
