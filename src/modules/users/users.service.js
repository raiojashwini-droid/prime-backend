const db = require('../../config/db');

async function getUsers({ page = 1, limit = 25, search, role, status, sortBy = 'created_at', sortOrder = 'desc' }) {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  let query = db('users').select(
    'id',
    'name',
    'email',
    'role',
    'status',
    'phone',
    'mfa_enabled',
    'created_at',
    'updated_at'
  );

  let countQuery = db('users').count({ total: '*' });

  if (search) {
    const term = `%${search}%`;
    query = query.where((builder) => {
      builder.where('name', 'like', term).orWhere('email', 'like', term);
    });
    countQuery = countQuery.where((builder) => {
      builder.where('name', 'like', term).orWhere('email', 'like', term);
    });
  }

  if (role) {
    query = query.where({ role });
    countQuery = countQuery.where({ role });
  }

  if (status) {
    query = query.where({ status });
    countQuery = countQuery.where({ status });
  }

  const validSortCols = ['id', 'name', 'email', 'role', 'status', 'created_at'];
  const safeSortCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';
  const safeSortDir = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const [items, countResult] = await Promise.all([
    query.orderBy(safeSortCol, safeSortDir).limit(limitNum).offset(offset),
    countQuery.first()
  ]);

  const total = Number(countResult?.total || 0);

  return {
    items: items.map((u) => ({ ...u, mfa_enabled: Boolean(u.mfa_enabled) })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
}

async function getUserById(id) {
  const user = await db('users')
    .where({ id })
    .select('id', 'name', 'email', 'role', 'status', 'phone', 'mfa_enabled', 'created_at', 'updated_at')
    .first();

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    ...user,
    mfa_enabled: Boolean(user.mfa_enabled)
  };
}

module.exports = {
  getUsers,
  getUserById
};
