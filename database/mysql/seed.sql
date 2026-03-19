USE ppob_blueprint;

INSERT INTO users (username, name, email, phone, apikey, password_hash, email_verified_at, balance, status)
VALUES
  ('demo', 'Demo User', 'demo@example.com', '081234567890', 'user-secret-key', '$2b$10$A9Gjlxrmymlh94jyycogKuEMZAgDiv5jnUARwpqoaIXlCl1n.Cqku', CURRENT_TIMESTAMP, 500000, 'active')
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  name = VALUES(name),
  phone = VALUES(phone),
  apikey = VALUES(apikey),
  password_hash = VALUES(password_hash),
  email_verified_at = VALUES(email_verified_at),
  balance = VALUES(balance),
  status = VALUES(status);

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

INSERT INTO transactions (invoice_no, user_id, product_id, amount, admin_fee, total_amount, status)
VALUES
  ('INV-0001', 1, 1, 20500, 2500, 23000, 'success')
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  admin_fee = VALUES(admin_fee),
  total_amount = VALUES(total_amount),
  status = VALUES(status);

INSERT INTO histories (user_id, transaction_id, action, description)
VALUES
  (1, 1, 'purchase', 'Pembelian token PLN berhasil')
ON DUPLICATE KEY UPDATE
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
