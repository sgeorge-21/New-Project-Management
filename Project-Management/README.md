# Group 3 Business

Responsive electronics storefront with a PHP REST API and MySQL persistence.

## Requirements

- PHP 7.4+ with `pdo_mysql` enabled
- MySQL 8.0+

## Create the database

Run the schema in MySQL Workbench, or from PowerShell:

```powershell
Get-Content .\database\schema.sql | mysql -u root -p
```

For an existing installation that has not yet been updated with a
`payment_method` column, run the earlier order-form update once:

```powershell
Get-Content .\database\add_order_contact_payment.sql | mysql -u root -p
```

Then remove the old phone column (run once):

```powershell
Get-Content .\database\remove_order_phone.sql | mysql -u root -p
```

The phone-removal migration permanently deletes the old phone values.

Create a restricted application user in MySQL. Replace the example password
with a long, unique password:

```sql
CREATE USER 'g3_app'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT SELECT, INSERT ON group3_business.* TO 'g3_app'@'127.0.0.1';
```

## Configure and run locally

From the project directory, set the database connection variables and start
PHP's development server in the same PowerShell window:

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_NAME = "group3_business"
$env:DB_USER = "g3_app"
$env:DB_PASSWORD = "REPLACE_WITH_A_LONG_RANDOM_PASSWORD"
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000/`. Do not open the HTML files using `file://` or
VS Code Live Server; the forms must reach the PHP API on the same origin.
Confirm the API and database connection at
`http://127.0.0.1:8000/api/index.php?route=health`.

For Apache or a production host, set the same environment variables in the
PHP/web-server environment. Use HTTPS in production and do not put database
credentials in JavaScript or public source control.

## API routes

All request and response bodies use JSON.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/index.php?route=health` | Check API and database connectivity |
| `POST` | `/api/index.php?route=auth/signup` | Create account and start a session |
| `POST` | `/api/index.php?route=auth/login` | Verify credentials and start a session |
| `GET` | `/api/index.php?route=auth/me` | Read the current session account |
| `POST` | `/api/index.php?route=auth/logout` | End the current session |
| `POST` | `/api/index.php?route=orders` | Save guest or signed-in customer order and items |
| `POST` | `/api/index.php?route=contact` | Save a contact/feedback message |

## Stored data

- `users`: email and a PHP `password_hash()` password hash (never the raw
  password)
- `orders`: customer name/email, selected payment method,
  server-calculated total, order/payment status, and optional account ID
- `order_items`: product name/ID/price snapshot and quantity for each order line
- `contact_messages`: contact name, email, message, and received timestamp

Card numbers, expiry, CVC, and PIN are not collected, sent to the API, or
stored. The checkout creates a recorded order only; it does not process a
payment. Use a PCI-compliant payment provider before enabling real payments.
Google sign-in also requires a configured OAuth provider and is not connected
by this demo.

To inspect records, connect with MySQL Workbench or run:

```powershell
mysql -u g3_app -p group3_business
```

Then query tables, for example:

```sql
SELECT id, email, created_at FROM users;
SELECT id, customer_name, customer_email, payment_method, total_amount, order_status, created_at FROM orders;
SELECT id, name, email, created_at FROM contact_messages;
```
