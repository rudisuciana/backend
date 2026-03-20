USE ppob_blueprint;

INSERT INTO users (username, name, email, phone, apikey, password_hash, email_verified_at, balance, status, avatar, whitelistip)
VALUES
  ('demo', 'Demo User', 'demo@example.com', '081234567890', 'user-secret-key', '$2b$10$A9Gjlxrmymlh94jyycogKuEMZAgDiv5jnUARwpqoaIXlCl1n.Cqku', CURRENT_TIMESTAMP, 500000, 'active', 'https://example.com/avatars/demo-user.png', '::ffff:127.0.0.1,127.0.0.1')
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  name = VALUES(name),
  phone = VALUES(phone),
  apikey = VALUES(apikey),
  password_hash = VALUES(password_hash),
  email_verified_at = VALUES(email_verified_at),
  balance = VALUES(balance),
  status = VALUES(status),
  avatar = VALUES(avatar),
  whitelistip = VALUES(whitelistip);

INSERT INTO products (code, name, category, price, admin_fee, is_active)
VALUES
  ('PLN20', 'Token PLN 20.000', 'electricity', 20500, 2500, 1),
  ('PULSA10', 'Pulsa 10.000', 'mobile-credit', 11500, 1500, 1),
  ('DATA1GB', 'Paket Data 1GB', 'mobile-data', 12500, 1500, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  price = VALUES(price),
  admin_fee = VALUES(admin_fee),
  is_active = VALUES(is_active);

INSERT INTO deposits (user_id, reference_no, amount, status)
VALUES
  (1, 'DEP-0001', 200000, 'success')
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  status = VALUES(status);

INSERT INTO histories (invoice_no, user_id, product_id, amount, admin_fee, total_amount, status, action, description)
VALUES
  ('INV-0001', 1, 1, 20500, 2500, 23000, 'success', 'purchase', 'Pembelian token PLN berhasil')
ON DUPLICATE KEY UPDATE
  product_id = VALUES(product_id),
  amount = VALUES(amount),
  admin_fee = VALUES(admin_fee),
  total_amount = VALUES(total_amount),
  status = VALUES(status),
  action = VALUES(action),
  description = VALUES(description);

INSERT INTO settings (`key`, `value`, description, is_active)
VALUES
  ('maintenance_mode', 'false', 'Global maintenance toggle', 1),
  ('default_admin_fee', '1500', 'Fallback admin fee for PPOB products', 1)
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO akrab (code, name, price, category, description)
VALUES
  (
    'XLA14',
    'SuperMini PROMO',
    43000,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 13 GB - 15 GB',
      '- Area 2 : 15 GB - 17 GB',
      '- Area 3 : 20 GB - 22 GB',
      '- Area 4 : 30 GB - 32 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  ),
  (
    'XLA32',
    'Mini',
    55500,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 31.75 GB - 33.75 GB',
      '- Area 2 : 33.75 - 35.75 GB',
      '- Area 3 : 38.75 - 40.75 GB',
      '- Area 4 : 48.75 - 50.75 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  ),
  (
    'XLA39',
    'Big',
    60000,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 38 GB - 40 GB',
      '- Area 2 : 40 GB - 42 GB',
      '- Area 3 : 45 GB - 47 GB',
      '- Area 4 : 55 GB - 57 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  ),
  (
    'XLA51',
    'Jumbo V2',
    70000,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 50.5 - 52.5 GB',
      '- Area 2 : 52.5 - 54.5 GB',
      '- Area 3 : 57.5 - 59.5 GB',
      '- Area 4 : 67.5 - 69.5 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  ),
  (
    'XLA65',
    'Jumbo',
    90000,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 65.5 - 67.5 GB',
      '- Area 2 : 70 - 72 GB',
      '- Area 3 : 83 - 85 GB',
      '- Area 4 : 123 - 125 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  ),
  (
    'XLA89',
    'MegaBig',
    93000,
    'Akrab Anggota',
    JSON_ARRAY(
      'Kuota Sesuai Area :',
      '- Area 1 : 88 GB - 90 GB',
      '- Area 2 : 90 GB - 92 GB',
      '- Area 3 : 95 GB - 97 GB',
      '- Area 4 : 105 GB - 107 GB',
      'Jika myRewerd tidak masuk silahkan tunggu 1 jam baru lapor ke admin &amp; Jika semua kuota sudah habis, maka paket otomatis ke kick'
    )
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  category = VALUES(category),
  description = VALUES(description);
