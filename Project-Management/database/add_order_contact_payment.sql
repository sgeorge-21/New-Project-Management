USE group3_business;

ALTER TABLE orders
  ADD COLUMN customer_phone VARCHAR(30) NULL AFTER customer_email,
  ADD COLUMN payment_method VARCHAR(24) NULL AFTER customer_phone;
