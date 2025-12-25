import dayjs from 'dayjs';

export const calcStatus = (loan) => {
  if (loan.status === "Defaulted") return "Defaulted";
  const totalRepayable = Number(loan.totalRepayable || 0);
  const repaidAmount = Number(loan.repaidAmount || 0);

  if (repaidAmount >= totalRepayable && totalRepayable > 0) {
    return "Paid";
  }
  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (due.isBefore(now, "day")) {
    return "Overdue";
  }
  return "Active";
};
