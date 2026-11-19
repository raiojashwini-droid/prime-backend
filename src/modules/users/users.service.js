const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');

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

async function createUser({ firstName, lastName, name, email, phone, role, status = 'active', department, permissions }) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    const error = new Error('Email is required');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const existing = await db('users').whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
  if (existing) {
    const error = new Error('A user with this email address already exists');
    error.status = 400;
    error.code = 'DUPLICATE_EMAIL';
    throw error;
  }

  const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim() || normalizedEmail;
  const passwordHash = await bcrypt.hash('123456', 10);

  const [newUserId] = await db('users').insert({
    name: fullName,
    email: normalizedEmail,
    password_hash: passwordHash,
    role: role || 'rental_operations',
    status: status || 'active',
    phone: phone || null,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Provision initial permissions if provided
  if (Array.isArray(permissions) && permissions.length > 0) {
    for (const p of permissions) {
      const moduleName = p.moduleName || p.module;
      if (!moduleName) continue;
      await prisma.permissions.create({
        data: {
          user_id: BigInt(newUserId),
          module: moduleName,
          can_view: Boolean(p.canView ?? p.can_view ?? true),
          can_add: Boolean(p.canAdd ?? p.can_add ?? false),
          can_edit: Boolean(p.canEdit ?? p.can_edit ?? false),
          can_delete: Boolean(p.canDelete ?? p.can_delete ?? false)
        }
      }).catch((err) => console.warn('Permission init error:', err.message));
    }
  }

  return {
    id: Number(newUserId),
    name: fullName,
    email: normalizedEmail,
    role: role || 'rental_operations',
    status: status || 'active',
    phone: phone || null,
    defaultPasswordSet: '123456'
  };
}

module.exports = {
  getUsers,
  getUserById,
  createUser
};
