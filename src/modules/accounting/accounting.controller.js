const accountingService = require('./accounting.service');

// 1. Stats & KPIs
async function getStats(req, res, next) {
  try {
    const data = await accountingService.getAccountingStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 2. Charges
async function listCharges(req, res, next) {
  try {
    const data = await accountingService.getAllCharges();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createCharge(req, res, next) {
  try {
    const data = await accountingService.createCharge(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 3. Payments
async function listPayments(req, res, next) {
  try {
    const data = await accountingService.getAllPayments();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createPayment(req, res, next) {
  try {
    const data = await accountingService.createPayment(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 4. Deposits
async function listDeposits(req, res, next) {
  try {
    const data = await accountingService.getAllDeposits();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createDeposit(req, res, next) {
  try {
    const data = await accountingService.createDeposit(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function releaseDeposit(req, res, next) {
  try {
    const rawId = parseInt(String(req.params.id).replace(/[^0-9]/g, ''), 10);
    const data = await accountingService.releaseDeposit(rawId, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 5. Refunds
async function listRefunds(req, res, next) {
  try {
    const data = await accountingService.getAllRefunds();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createRefund(req, res, next) {
  try {
    const data = await accountingService.createRefund(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 6. Credits
async function listCredits(req, res, next) {
  try {
    const data = await accountingService.getAllCredits();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createCredit(req, res, next) {
  try {
    const data = await accountingService.createCredit(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 7. Invoices
async function listInvoices(req, res, next) {
  try {
    const data = await accountingService.getAllInvoices();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createInvoice(req, res, next) {
  try {
    const data = await accountingService.createInvoice(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 8. Payables (AP)
async function listPayables(req, res, next) {
  try {
    const data = await accountingService.getAllPayables();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createPayable(req, res, next) {
  try {
    const data = await accountingService.createPayable(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updatePayableStatus(req, res, next) {
  try {
    const rawId = parseInt(String(req.params.id).replace(/[^0-9]/g, ''), 10);
    const data = await accountingService.updatePayableStatus(rawId, req.body.status);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 9. Balances
async function listDriverBalances(req, res, next) {
  try {
    const data = await accountingService.getDriverBalances();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 10. Reversals
async function reverseTransaction(req, res, next) {
  try {
    const data = await accountingService.reverseTransaction(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 11. Delete / Void
async function deleteEntry(req, res, next) {
  try {
    const { type, id } = req.params;
    const data = await accountingService.deleteEntry(type, id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

// 12. Vendors
async function listVendors(req, res, next) {
  try {
    const data = await accountingService.getAllVendors();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
  listCharges,
  createCharge,
  listPayments,
  createPayment,
  listDeposits,
  createDeposit,
  releaseDeposit,
  listRefunds,
  createRefund,
  listCredits,
  createCredit,
  listInvoices,
  createInvoice,
  listPayables,
  createPayable,
  updatePayableStatus,
  listDriverBalances,
  listVendors,
  reverseTransaction,
  deleteEntry
};
