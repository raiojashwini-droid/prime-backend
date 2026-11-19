const db = require('../../config/db');

async function getGeneralSettings() {
  const rows = await db('settings').select('*');
  const map = {};
  rows.forEach((r) => {
    map[r.setting_key] = r.setting_value;
  });

  return {
    company: {
      name: map['company_name'] || 'PrimeRoute Global Fleet Systems',
      tagline: map['company_tagline'] || 'Manage • Track • Grow',
      email: map['company_email'] || 'admin@primeroute.io',
      phone: map['company_phone'] || '+1 (800) 555-ROUT',
      website: map['company_website'] || 'https://primeroute.io',
      taxId: map['company_tax_id'] || 'US-EIN-948210382',
      address: map['company_address'] || '500 Madison Ave, Floor 24, New York, NY 10022',
      currency: map['currency'] || 'USD ($)',
      oilChangeInterval: Number(map['oil_change_interval_miles']) || 5000,
      logo: map['company_logo'] || '/primeroute-logo.png',
    },
    maintenanceIntervals: {
      oilChangeMiles: Number(map['oil_change_interval_miles']) || 5000,
    },
    raw: map
  };
}

async function updateGeneralSettings(data) {
  const company = data.company || data;
  const updates = [
    { key: 'company_name', val: company.name, desc: 'Official registered company business name' },
    { key: 'company_tagline', val: company.tagline, desc: 'Company slogan or tagline' },
    { key: 'company_email', val: company.email, desc: 'Primary customer support and operations email' },
    { key: 'company_phone', val: company.phone, desc: 'Primary customer service phone number' },
    { key: 'company_website', val: company.website, desc: 'Official fleet website url' },
    { key: 'company_tax_id', val: company.taxId, desc: 'Federal employer tax ID (EIN)' },
    { key: 'company_address', val: company.address, desc: 'Principal headquarters physical address' },
    { key: 'company_logo', val: company.logo, desc: 'Corporate logo data URL or path' },
    { key: 'currency', val: company.currency, desc: 'Default operational currency' },
    {
      key: 'oil_change_interval_miles',
      val: String(company.oilChangeInterval || data.maintenanceIntervals?.oilChangeMiles || 5000),
      desc: 'Standard routine oil change mileage threshold'
    }
  ];

  for (const item of updates) {
    if (item.val !== undefined && item.val !== null) {
      const existing = await db('settings').where({ setting_key: item.key }).first();
      if (existing) {
        await db('settings')
          .where({ setting_key: item.key })
          .update({
            setting_value: String(item.val),
            updated_at: db.fn.now()
          });
      } else {
        await db('settings').insert({
          setting_key: item.key,
          setting_value: String(item.val),
          description: item.desc,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        });
      }
    }
  }

  return getGeneralSettings();
}

async function getAllSettings() {
  return db('settings').select('*');
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getAllSettings
};
