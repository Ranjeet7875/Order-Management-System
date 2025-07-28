exports.exportToCSV = (orders) => {
  const headers = 'OrderID,CustomerName,Status,PaymentReceived,CreatedAt\n';
  const rows = orders.map(o =>
    `${o._id},${o.customerName},${o.status},${o.paymentReceived},${o.createdAt.toISOString()}`
  );
  return headers + rows.join('\n');
};