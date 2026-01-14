
export const COLORS = {
  revenue: "#4caf50",
  costs: "#f44336",
  performing: "#2196f3",
  overdue: "#ff9800",
  neutral: "#9e9e9e"
};

export const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'ZMW', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(value);
