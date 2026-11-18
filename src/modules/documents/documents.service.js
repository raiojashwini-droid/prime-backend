const prisma = require('../../config/prisma');

function safeFormatDate(d, fallback = null) {
  if (!d) return fallback;
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  } catch (err) {}
  return fallback;
}

function formatDocument(doc) {
  let meta = {};
  if (doc.notes) {
    try {
      meta = JSON.parse(doc.notes);
    } catch (e) {
      meta = { rawNotes: doc.notes };
    }
  }

  const rawId = Number(doc.id);
  const formattedId = meta.customId || `DOC-${String(rawId + 500).padStart(3, '0')}`;

  let relatedTo = meta.relatedTo;
  if (!relatedTo) {
    if (doc.vehicles) {
      relatedTo = `Vehicle: ${doc.vehicles.make} ${doc.vehicles.model} (${doc.vehicles.plate})`;
    } else if (doc.drivers) {
      relatedTo = `Driver: ${doc.drivers.first_name} ${doc.drivers.last_name}`;
    } else if (doc.rentals) {
      relatedTo = `Contract: ${doc.rentals.contract_no}`;
    } else {
      relatedTo = 'General Fleet Operations Hub';
    }
  }

  const expiryStr = safeFormatDate(doc.expiry_date, null);
  const uploadedDateStr = safeFormatDate(doc.created_at, new Date().toISOString().split('T')[0]);

  const uploaderName = doc.users
    ? `${doc.users.name || doc.users.email} (${doc.users.role || 'Staff'})`
    : (meta.uploadedBy || 'Marcus Brody (Owner)');

  let status = 'Valid';
  if (expiryStr) {
    const diffDays = Math.ceil((new Date(expiryStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 30) status = 'Expiring Soon';
  }

  return {
    id: formattedId,
    dbId: rawId,
    name: doc.title,
    type: (doc.document_type || 'other').toLowerCase(),
    category: meta.category || doc.document_type || 'General Document',
    linkedRecord: meta.linkedRecord || {
      type: doc.vehicle_id ? 'vehicle' : doc.driver_id ? 'driver' : doc.rental_id ? 'rental' : 'general',
      id: doc.vehicle_id ? `VEH-${String(doc.vehicle_id).padStart(3, '0')}` : 'GEN-FLEET',
      formatted: relatedTo
    },
    relatedTo,
    expiryDate: expiryStr,
    uploadedBy: uploaderName,
    uploadedDate: uploadedDateStr,
    version: meta.version || (doc.document_versions?.[0] ? `v${doc.document_versions[0].version_number}.0` : 'v1.0'),
    fileSize: meta.fileSize || `${((doc.file_size || 1500000) / (1024 * 1024)).toFixed(1)} MB`,
    fileType: meta.fileType || (doc.mime_type?.includes('pdf') ? 'PDF' : 'JPG'),
    fileUrl: doc.file_url,
    status,
    isRestricted: Boolean(meta.isRestricted),
    versionHistory: doc.document_versions?.length
      ? doc.document_versions.map((v) => ({
          version: `v${v.version_number}.0`,
          uploadedDate: safeFormatDate(v.created_at, uploadedDateStr),
          uploadedBy: uploaderName,
          notes: v.change_summary || 'Document version archive',
          fileSize: `${((v.file_size || 1500000) / (1024 * 1024)).toFixed(1)} MB`
        }))
      : [
          {
            version: meta.version || 'v1.0',
            uploadedDate: uploadedDateStr,
            uploadedBy: uploaderName,
            notes: meta.notes || 'Initial document upload',
            fileSize: meta.fileSize || '1.8 MB'
          }
        ]
  };
}

async function getAllDocuments() {
  const list = await prisma.documents.findMany({
    include: {
      vehicles: true,
      drivers: true,
      rentals: true,
      users: true,
      document_versions: true
    },
    orderBy: { id: 'desc' }
  });

  return list.map(formatDocument);
}

async function getDocumentById(id) {
  let doc = null;
  const numId = Number(id);
  if (!isNaN(numId) && numId > 0) {
    doc = await prisma.documents.findUnique({
      where: { id: BigInt(numId) },
      include: {
        vehicles: true,
        drivers: true,
        rentals: true,
        users: true,
        document_versions: true
      }
    });
  }

  if (!doc) {
    const all = await prisma.documents.findMany({
      include: {
        vehicles: true,
        drivers: true,
        rentals: true,
        users: true,
        document_versions: true
      }
    });
    doc = all.find((d) => {
      if (d.notes && d.notes.includes(String(id))) return true;
      const formatted = `DOC-${String(Number(d.id) + 500).padStart(3, '0')}`;
      return formatted === String(id);
    });
  }

  if (!doc) return null;
  return formatDocument(doc);
}

async function createDocument(data, userId) {
  const meta = {
    customId: data.id,
    category: data.category,
    linkedRecord: data.linkedRecord,
    relatedTo: data.relatedTo,
    isRestricted: Boolean(data.isRestricted),
    version: data.version || 'v1.0',
    fileSize: data.fileSize || '2.1 MB',
    fileType: data.fileType || 'PDF',
    uploadedBy: data.uploadedBy,
    notes: data.notes
  };

  let vehicleId = null;
  let driverId = null;
  let rentalId = null;

  if (data.linkedRecord?.type === 'vehicle' && data.linkedRecord.id) {
    const raw = parseInt(String(data.linkedRecord.id).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(raw) && raw > 0) vehicleId = BigInt(raw);
  } else if (data.linkedRecord?.type === 'driver' && data.linkedRecord.id) {
    const raw = parseInt(String(data.linkedRecord.id).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(raw) && raw > 0) driverId = BigInt(raw);
  } else if (data.linkedRecord?.type === 'rental' && data.linkedRecord.id) {
    const raw = parseInt(String(data.linkedRecord.id).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(raw) && raw > 0) rentalId = BigInt(raw);
  }

  let expiryDate = null;
  if (data.expiryDate && data.expiryDate !== 'Permanent') {
    try {
      const parsed = new Date(data.expiryDate);
      if (!isNaN(parsed.getTime())) expiryDate = parsed;
    } catch (e) {}
  }

  const created = await prisma.documents.create({
    data: {
      title: data.name || 'Untitled Document',
      document_type: (data.type || 'other').toLowerCase(),
      file_url: data.fileUrl || '/uploads/documents/doc-sample.pdf',
      file_size: 2100000,
      mime_type: data.fileType === 'JPG' || data.fileType === 'PNG' ? 'image/jpeg' : 'application/pdf',
      vehicle_id: vehicleId,
      driver_id: driverId,
      rental_id: rentalId,
      uploaded_by: userId ? BigInt(userId) : null,
      expiry_date: expiryDate,
      notes: JSON.stringify(meta)
    },
    include: {
      vehicles: true,
      drivers: true,
      rentals: true,
      users: true,
      document_versions: true
    }
  });

  return formatDocument(created);
}

async function deleteDocument(id) {
  let doc = null;
  const numId = Number(id);

  if (!isNaN(numId) && numId > 0) {
    doc = await prisma.documents.findUnique({ where: { id: BigInt(numId) } });
  }

  if (!doc) {
    const all = await prisma.documents.findMany();
    doc = all.find((d) => {
      if (d.notes && d.notes.includes(String(id))) return true;
      const formatted = `DOC-${String(Number(d.id) + 500).padStart(3, '0')}`;
      return formatted === String(id);
    });
  }

  if (doc) {
    await prisma.documents.delete({ where: { id: doc.id } });
    return { success: true, message: 'Document permanently deleted from database' };
  }

  return { success: true, message: 'Document already removed' };
}

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  deleteDocument
};
