<?php
/**
 * send-mail.php — contact-form handler for the Amit Chouhan portfolio.
 *
 * Accepts a POST (name, email, message), validates + sanitises it, checks a
 * honeypot, and emails martialamit5@gmail.com via PHP's built-in mail().
 * Always responds with JSON: { "success": bool, "message": string }.
 *
 * ⚠️  NOTE: PHP mail() on free hosts (e.g. InfinityFree) is often unreliable —
 *     messages may be delayed, land in spam, or be dropped entirely. For
 *     dependable delivery, replace the mail() call below with SMTP (PHPMailer
 *     + your email provider's SMTP credentials). This handler already fails
 *     gracefully and tells the user to email directly if sending fails.
 */

header('Content-Type: application/json; charset=utf-8');

/* ---- Config ------------------------------------------------------------ */
$TO      = 'martialamit5@gmail.com';
$SUBJECT = 'New message from your portfolio';
// IMPORTANT: InfinityFree (and most hosts) require the From address to be on a
// domain you control. Set this to e.g. contact@yourdomain.rf.gd before going live.
$FROM    = 'noreply@example.com';

/* ---- Only accept POST -------------------------------------------------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* ---- Honeypot: real users never fill the hidden "company" field -------- */
if (!empty($_POST['company'])) {
    // Pretend success so bots don't retry — but send nothing.
    echo json_encode(['success' => true, 'message' => 'Thanks! Your message has been sent.']);
    exit;
}

/* ---- Collect + validate ------------------------------------------------ */
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$message = trim($_POST['message'] ?? '');

$missing = [];
if ($name === '' || mb_strlen($name) > 100)        { $missing[] = 'a valid name'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    { $missing[] = 'a valid email'; }
if ($message === '' || mb_strlen($message) > 5000) { $missing[] = 'a message'; }

if ($missing) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please provide ' . implode(', ', $missing) . '.']);
    exit;
}

/* ---- Strip CR/LF from header-bound values (prevents header injection) --- */
$cleanName  = preg_replace('/[\r\n]+/', ' ', $name);
$cleanEmail = preg_replace('/[\r\n]+/', ' ', $email);

/* ---- Build + send ------------------------------------------------------ */
$body  = "New portfolio enquiry\n\n";
$body .= "Name:  {$cleanName}\n";
$body .= "Email: {$cleanEmail}\n\n";
$body .= "Message:\n{$message}\n";

$headers  = "From: Portfolio Contact <{$FROM}>\r\n";
$headers .= "Reply-To: {$cleanName} <{$cleanEmail}>\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= 'X-Mailer: PHP/' . phpversion();

$sent = @mail($TO, $SUBJECT, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => "Thanks, {$cleanName}! Your message is on its way."]);
} else {
    // Fail gracefully — always give the user another route.
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sorry — the mailer is unavailable right now. Please email martialamit5@gmail.com directly.'
    ]);
}
