// frontend/src/utils/exportUtils.js
import Papa from 'papaparse';

export const exportTransactionsToCSV = (transactions, dateRange = null) => {
  // Filter transactions by date range if provided
  let filteredTransactions = transactions;
  if (dateRange && dateRange.start && dateRange.end) {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= new Date(dateRange.start) && 
             transactionDate <= new Date(dateRange.end);
    });
  }

  // Prepare data for CSV
  const csvData = filteredTransactions.map(transaction => ({
    Date: new Date(transaction.date).toLocaleDateString(),
    Description: transaction.description,
    Category: transaction.category_name,
    Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    Amount: `$${parseFloat(transaction.amount).toFixed(2)}`,
    'Created At': new Date(transaction.created_at).toLocaleString()
  }));

  // Generate CSV
  const csv = Papa.unparse(csvData);
  
  // Create filename with date range
  const startDate = dateRange?.start ? new Date(dateRange.start).toISOString().split('T')[0] : 'all';
  const endDate = dateRange?.end ? new Date(dateRange.end).toISOString().split('T')[0] : 'time';
  const filename = `flowtrack_transactions_${startDate}_to_${endDate}.csv`;

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return {
    success: true,
    filename,
    recordCount: filteredTransactions.length
  };
};

export const exportSummaryToCSV = (summary, categories) => {
  const summaryData = [
    { Metric: 'Total Income', Value: `$${summary.totalIncome.toFixed(2)}` },
    { Metric: 'Total Expenses', Value: `$${summary.totalExpenses.toFixed(2)}` },
    { Metric: 'Current Balance', Value: `$${summary.balance.toFixed(2)}` },
    { Metric: 'Transaction Count', Value: summary.transactionCount },
    { Metric: 'Report Generated', Value: new Date().toLocaleString() }
  ];

  // Add category breakdown
  categories.forEach(category => {
    summaryData.push({
      Metric: `${category.name} Total`,
      Value: `$${category.total?.toFixed(2) || '0.00'}`
    });
  });

  const csv = Papa.unparse(summaryData);
  const filename = `flowtrack_summary_${new Date().toISOString().split('T')[0]}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { success: true, filename };
};