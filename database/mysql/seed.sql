USE ppob_blueprint;

INSERT INTO users (name, email, balance, status)
VALUES
  ('Demo User', 'demo@example.com', 500000, 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  balance = VALUES(balance),
  status = VALUES(status);

INSERT INTO ppob_products (code, name, category, price, admin_fee, is_active)
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
