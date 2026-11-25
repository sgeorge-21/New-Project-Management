<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function request_data(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== 0) {
        respond(415, ['error' => 'Send request data as JSON.']);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 65536) {
        respond(413, ['error' => 'Request is too large.']);
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(400, ['error' => 'Invalid JSON request.']);
    }

    return $data;
}

function required_string(array $data, string $key, int $maxLength): string
{
    $value = $data[$key] ?? null;
    if (!is_string($value)) {
        respond(422, ['error' => 'Please provide a valid ' . $key . '.']);
    }

    $value = trim($value);
    if ($value === '' || strlen($value) > $maxLength) {
        respond(422, ['error' => 'Please provide a valid ' . $key . '.']);
    }

    return $value;
}

function valid_email(array $data): string
{
    $email = required_string($data, 'email', 254);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(422, ['error' => 'Please provide a valid email address.']);
    }

    return strtolower($email);
}

function current_user(): ?array
{
    if (!isset($_SESSION['user_id'], $_SESSION['user_email'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'email' => (string) $_SESSION['user_email'],
    ];
}

$route = trim((string) ($_SERVER['PATH_INFO'] ?? ''), '/');
if ($route === '') {
    $route = trim((string) ($_GET['route'] ?? ''), '/');
}
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

require_once __DIR__ . '/db.php';

session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Lax',
    'path' => '/',
]);
session_start();

if ($method === 'GET' && $route === 'health') {
    respond(200, ['status' => 'ok', 'database' => 'connected']);
}

if ($method === 'GET' && $route === 'auth/me') {
    respond(200, ['user' => current_user()]);
}

if ($method === 'POST' && $route === 'auth/signup') {
    $data = request_data();
    $email = valid_email($data);
    $password = $data['password'] ?? null;
    if (!is_string($password) || strlen($password) < 12 || strlen($password) > 200) {
        respond(422, ['error' => 'Password must be at least 12 characters.']);
    }

    try {
        $statement = $pdo->prepare(
            'INSERT INTO users (email, password_hash) VALUES (:email, :password_hash)'
        );
        $statement->execute([
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            respond(409, ['error' => 'An account with this email already exists.']);
        }
        error_log('Group 3 API signup failed: ' . $error->getMessage());
        respond(500, ['error' => 'Could not create the account.']);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    $_SESSION['user_email'] = $email;
    respond(201, ['user' => current_user()]);
}

if ($method === 'POST' && $route === 'auth/login') {
    $data = request_data();
    $email = valid_email($data);
    $password = $data['password'] ?? null;
    if (!is_string($password) || $password === '') {
        respond(422, ['error' => 'Please provide a password.']);
    }

    try {
        $statement = $pdo->prepare(
            'SELECT id, email, password_hash FROM users WHERE email = :email LIMIT 1'
        );
        $statement->execute(['email' => $email]);
        $user = $statement->fetch();
    } catch (PDOException $error) {
        error_log('Group 3 API login failed: ' . $error->getMessage());
        respond(500, ['error' => 'Could not log in at this time.']);
    }
    if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(401, ['error' => 'Email or password is incorrect.']);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_email'] = $user['email'];
    respond(200, ['user' => current_user()]);
}

if ($method === 'POST' && $route === 'auth/logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => 'Lax',
        ]);
    }
    session_destroy();
    respond(200, ['status' => 'signed_out']);
}

if ($method === 'POST' && $route === 'contact') {
    $data = request_data();
    $name = required_string($data, 'name', 120);
    $email = valid_email($data);
    $message = required_string($data, 'message', 10000);

    try {
        $statement = $pdo->prepare(
            'INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)'
        );
        $statement->execute([
            'name' => $name,
            'email' => $email,
            'message' => $message,
        ]);
    } catch (PDOException $error) {
        error_log('Group 3 API contact submission failed: ' . $error->getMessage());
        respond(500, ['error' => 'Could not save your message.']);
    }

    respond(201, ['status' => 'received']);
}

if ($method === 'POST' && $route === 'orders') {
    $data = request_data();
    $name = required_string($data, 'name', 120);
    $email = valid_email($data);
    $paymentMethod = required_string($data, 'paymentMethod', 24);
    if (!in_array($paymentMethod, ['visa', 'orange-money', 'mobile-money'], true)) {
        respond(422, ['error' => 'Please choose a valid payment method.']);
    }
    $items = $data['items'] ?? null;
    if (!is_array($items) || count($items) < 1 || count($items) > 50) {
        respond(422, ['error' => 'Your order must contain between 1 and 50 items.']);
    }

    $catalog = [
        1 => ['Aurora Laptop 14', 899.00],
        2 => ['Pixel One Pro', 749.00],
        3 => ['Studio Quiet Headphones', 249.00],
        4 => ['Tab Pro 11', 529.00],
        5 => ['Everyday Smartwatch', 199.00],
        6 => ['Device Care Plan', 89.00],
        7 => ['AeroBook Pro 16', 1299.00],
        8 => ['HomeHub Mini', 129.00],
        9 => ['SoundBar Air', 329.00],
        10 => ['Pro Camera Kit', 679.00],
        11 => ['FastCharge Dock', 79.00],
        12 => ['Screen & Battery Service', 149.00],
        13 => ['LinkWave Wi-Fi 6 Router', 179.00],
        14 => ['LinkWave Mesh Router', 299.00],
        15 => ['ProConnect 8-Port Switch', 89.00],
        16 => ['ProConnect 24-Port Switch', 239.00],
    ];

    $orderItems = [];
    $total = 0.0;
    foreach ($items as $item) {
        if (!is_array($item)) {
            respond(422, ['error' => 'Invalid order item.']);
        }
        $productId = filter_var($item['productId'] ?? null, FILTER_VALIDATE_INT);
        $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
        if (!$productId || !isset($catalog[$productId]) || !$quantity || $quantity < 1 || $quantity > 50) {
            respond(422, ['error' => 'Invalid product or quantity in the order.']);
        }

        [$productName, $unitPrice] = $catalog[$productId];
        $orderItems[] = [
            'product_id' => $productId,
            'product_name' => $productName,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
        ];
        $total += $unitPrice * $quantity;
    }

    try {
        $pdo->beginTransaction();
        $orderStatement = $pdo->prepare(
            'INSERT INTO orders (user_id, customer_name, customer_email, payment_method, total_amount) ' .
            'VALUES (:user_id, :name, :email, :payment_method, :total)'
        );
        $user = current_user();
        $orderStatement->execute([
            'user_id' => $user ? $user['id'] : null,
            'name' => $name,
            'email' => $email,
            'payment_method' => $paymentMethod,
            'total' => number_format($total, 2, '.', ''),
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $itemStatement = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) ' .
            'VALUES (:order_id, :product_id, :product_name, :unit_price, :quantity)'
        );
        foreach ($orderItems as $orderItem) {
            $itemStatement->execute([
                'order_id' => $orderId,
                'product_id' => $orderItem['product_id'],
                'product_name' => $orderItem['product_name'],
                'unit_price' => number_format($orderItem['unit_price'], 2, '.', ''),
                'quantity' => $orderItem['quantity'],
            ]);
        }
        $pdo->commit();
    } catch (PDOException $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Group 3 API order creation failed: ' . $error->getMessage());
        respond(500, ['error' => 'Could not save your order.']);
    }

    respond(201, [
        'orderId' => $orderId,
        'total' => number_format($total, 2, '.', ''),
        'paymentStatus' => 'not_processed',
    ]);
}

respond(404, ['error' => 'API route not found.']);
