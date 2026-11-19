const db = require('../../config/db');

function formatRole(role) {
  if (!role) return 'System';
  switch (role.toLowerCase()) {
    case 'owner':
      return 'Owner';
    case 'secondary_admin':
      return 'Secondary Admin';
    case 'finance':
      return 'Finance';
    case 'fleet_maintenance':
      return 'Fleet Ops';
    case 'rental_operations':
      return 'Rental Ops';
    case 'readonly_manager':
      return 'Read-Only Manager';
    default:
      return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
}

function parsePayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch (e) {
    return { value: String(payload) };
  }
}

async function getAuditLogs({
  page = 1,
  limit = 50,
  user,
  userId,
  action,
  module: mod,
  datePeriod,
  search,
  sortBy = 'created_at',
  sortOrder = 'desc'
}) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.id',
      'audit_logs.user_id',
      'users.name as user_name',
      'users.role as user_role',
      'audit_logs.module',
      'audit_logs.action',
      'audit_logs.entity_type',
      'audit_logs.entity_id',
      'audit_logs.old_values',
      'audit_logs.new_values',
      'audit_logs.ip_address',
      'audit_logs.user_agent',
      'audit_logs.created_at'
    );

  let countQuery = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .count({ total: 'audit_logs.id' });

  // Filter: user (string name or userId)
  if (userId) {
    query = query.where('audit_logs.user_id', userId);
    countQuery = countQuery.where('audit_logs.user_id', userId);
  } else if (user && user !== 'All Users') {
    const firstName = user.split(' ')[0];
    query = query.where('users.name', 'like', `%${firstName}%`);
    countQuery = countQuery.where('users.name', 'like', `%${firstName}%`);
  }

  // Filter: action
  if (action && action !== 'All Actions') {
    query = query.where('audit_logs.action', action);
    countQuery = countQuery.where('audit_logs.action', action);
  }

  // Filter: module
  if (mod && mod !== 'All Modules') {
    query = query.where('audit_logs.module', mod);
    countQuery = countQuery.where('audit_logs.module', mod);
  }

  // Filter: datePeriod (Today | 7days | 30days)
  if (datePeriod && datePeriod !== 'All') {
    const now = new Date();
    let startDate = new Date();
    if (datePeriod === 'Today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (datePeriod === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (datePeriod === '30days') {
      startDate.setDate(now.getDate() - 30);
    }
    query = query.where('audit_logs.created_at', '>=', startDate);
    countQuery = countQuery.where('audit_logs.created_at', '>=', startDate);
  }

  // Filter: search query across multiple fields
  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    const searchFilter = function (builder) {
      builder
        .whereRaw('LOWER(users.name) LIKE ?', [term])
        .orWhereRaw('LOWER(audit_logs.action) LIKE ?', [term])
        .orWhereRaw('LOWER(audit_logs.module) LIKE ?', [term])
        .orWhereRaw('LOWER(COALESCE(audit_logs.entity_type, "")) LIKE ?', [term])
        .orWhereRaw('LOWER(COALESCE(audit_logs.old_values, "")) LIKE ?', [term])
        .orWhereRaw('LOWER(COALESCE(audit_logs.new_values, "")) LIKE ?', [term]);
    };
    query = query.where(searchFilter);
    countQuery = countQuery.where(searchFilter);
  }

  const validSortCols = {
    id: 'audit_logs.id',
    created_at: 'audit_logs.created_at',
    module: 'audit_logs.module',
    action: 'audit_logs.action'
  };
  const safeSortCol = validSortCols[sortBy] || 'audit_logs.created_at';
  const safeSortDir = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [rawRows, countResult] = await Promise.all([
    query.orderBy(safeSortCol, safeSortDir).limit(limitNum).offset(offset),
    countQuery.first()
  ]);

  const total = countResult ? parseInt(countResult.total, 10) : 0;

  // Format into frontend expected structure
  const formattedLogs = rawRows.map((row) => {
    const oldParsed = parsePayload(row.old_values);
    const newParsed = parsePayload(row.new_values);

    let previousVal = oldParsed?.value || (typeof oldParsed === 'string' ? oldParsed : null);
    if (!previousVal && oldParsed && typeof oldParsed === 'object') {
      previousVal = JSON.stringify(oldParsed);
    }

    let newVal = newParsed?.value || (typeof newParsed === 'string' ? newParsed : null);
    if (!newVal && newParsed && typeof newParsed === 'object') {
      newVal = JSON.stringify(newParsed);
    }

    const notes = newParsed?.notes || oldParsed?.notes || `${row.action} action executed in ${row.module}`;
    const record =
      newParsed?.record ||
      oldParsed?.record ||
      `${row.entity_type || 'Record'} #${row.entity_id || row.id}`;

    const userName = row.user_name || 'System / Automated';
    const userRoleStr = formatRole(row.user_role);

    return {
      id: `AUD-${String(row.id).padStart(4, '0')}`,
      rawId: row.id,
      timestamp: formatDate(row.created_at),
      isoTimestamp: row.created_at,
      user: `${userName} (${userRoleStr})`,
      userId: row.user_id,
      action: row.action,
      module: row.module,
      record: record,
      previousValue: previousVal || null,
      newValue: newVal || 'Active',
      notes: notes,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  });

  return {
    logs: formattedLogs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
}

async function createAuditLog({
  userId,
  module: mod,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  notes,
  record,
  ipAddress,
  userAgent
}) {
  // Ensure old_values is valid JSON or null to satisfy MySQL CHECK (json_valid(old_values))
  let finalOld = null;
  if (oldValues !== undefined && oldValues !== null) {
    if (typeof oldValues === 'object') {
      finalOld = JSON.stringify(oldValues);
    } else {
      finalOld = JSON.stringify({ value: String(oldValues) });
    }
  }

  // Ensure new_values is valid JSON to satisfy MySQL CHECK (json_valid(new_values))
  let finalNew = null;
  if (newValues !== undefined && newValues !== null) {
    if (typeof newValues === 'object') {
      finalNew = JSON.stringify({
        record: record || newValues.record,
        notes: notes || newValues.notes,
        ...newValues
      });
    } else {
      finalNew = JSON.stringify({
        value: String(newValues),
        record: record || `${entityType || 'Record'} #${entityId || ''}`,
        notes: notes || `${action} on ${mod}`
      });
    }
  } else {
    finalNew = JSON.stringify({
      value: 'Updated',
      record: record || `${entityType || 'Record'} #${entityId || ''}`,
      notes: notes || `${action} on ${mod}`
    });
  }

  const [insertedId] = await db('audit_logs').insert({
    user_id: userId || null,
    module: mod || 'System',
    action: action || 'Edit',
    entity_type: entityType || null,
    entity_id: entityId || null,
    old_values: finalOld,
    new_values: finalNew,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    created_at: new Date()
  });

  return { id: insertedId };
}

async function getAuditFiltersMetadata() {
  // 1. Fetch real active users directly from MySQL 'users' table
  const dbUsers = await db('users')
    .select('id', 'name', 'role')
    .orderBy('id', 'asc');

  const formattedUsers = dbUsers.map((u) => ({
    id: u.id,
    name: u.name,
    role: formatRole(u.role),
    label: `${u.name} (${formatRole(u.role)})`
  }));

  // 2. Fetch all distinct modules from audit_logs table, merged with registered system modules
  const rawModules = await db('audit_logs')
    .distinct('module')
    .whereNotNull('module')
    .pluck('module');

  const baseModules = [
    'Vehicles',
    'Drivers',
    'Rentals',
    'Accounting',
    'Inspections',
    'Documents',
    'Users & Roles',
    'Settings',
    'Maintenance',
    'Tolls & Tickets'
  ];
  const allModules = Array.from(new Set([...rawModules.filter(Boolean), ...baseModules])).sort();

  // 3. Fetch all distinct actions from audit_logs table, merged with system actions
  const rawActions = await db('audit_logs')
    .distinct('action')
    .whereNotNull('action')
    .pluck('action');

  const baseActions = [
    'Create',
    'Edit',
    'Approve',
    'Archive',
    'Contract Generated / Amended',
    'Permission Change',
    'Document Activity'
  ];
  const allActions = Array.from(new Set([...rawActions.filter(Boolean), ...baseActions])).sort();

  return {
    users: formattedUsers,
    modules: allModules,
    actions: allActions
  };
}

module.exports = {
  getAuditLogs,
  createAuditLog,
  getAuditFiltersMetadata
};
