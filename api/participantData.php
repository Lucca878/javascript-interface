<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Google\Cloud\Storage\StorageClient;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

const DEFAULT_GCS_BUCKET = 'paraphrasing-attacks-data-euw4';
const CSV_MAX_ATTEMPTS   = 10;

function getEnvString(string $key, string $default = ''): string
{
	$value = getenv($key);
	if ($value === false) {
		return $default;
	}

	return trim((string) $value);
}

function getStorageBackend(): string
{
	$backend = strtolower(getEnvString('STORAGE_BACKEND', 'postgres'));

	if (!in_array($backend, ['postgres', 'gcloud'], true)) {
		return 'postgres';
	}

	return $backend;
}

function getFallbackStorageBackend(string $primary): string
{
	$fallback = strtolower(getEnvString('STORAGE_FALLBACK_BACKEND', 'gcloud'));

	if (!in_array($fallback, ['none', 'postgres', 'gcloud'], true)) {
		$fallback = 'none';
	}

	if ($fallback === $primary) {
		return 'none';
	}

	return $fallback;
}

function getGcsBucketName(): string
{
	return getEnvString('GCS_BUCKET', DEFAULT_GCS_BUCKET);
}

function getGcsCredentialsPath(): string
{
	return getEnvString('GCS_CREDENTIALS_PATH', __DIR__ . '/../gcs-credentials.json');
}

function getPdoConnection(): PDO
{
	$dsn = getEnvString('POSTGRES_DSN', '');

	if ($dsn === '') {
		$host = getEnvString('POSTGRES_HOST', '127.0.0.1');
		$port = getEnvString('POSTGRES_PORT', '5432');
		$db   = getEnvString('POSTGRES_DB', 'study');
		$ssl  = getEnvString('POSTGRES_SSLMODE', 'prefer');
		$dsn  = sprintf('pgsql:host=%s;port=%s;dbname=%s;sslmode=%s', $host, $port, $db, $ssl);
	}

	$user = getEnvString('POSTGRES_USER', 'study_app');
	$pass = getEnvString('POSTGRES_PASSWORD', '');

	return new PDO(
		$dsn,
		$user,
		$pass,
		[
			PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
			PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
		]
	);
}

function scalarToString($value): string
{
	if ($value === null) {
		return '';
	}

	if (is_bool($value)) {
		return $value ? '1' : '0';
	}

	if (is_array($value)) {
		return implode(' | ', array_map(static fn($item): string => (string) $item, $value));
	}

	return (string) $value;
}

function getNested(array $source, array $path, $default = null)
{
	$current = $source;

	foreach ($path as $segment) {
		if (!is_array($current) || !array_key_exists($segment, $current)) {
			return $default;
		}
		$current = $current[$segment];
	}

	return $current;
}

function buildSessionCsvRow(array $payload, string $receivedAt): array
{
	$taskStatements = getNested($payload, ['pages', 'task', 'statements'], []);
	$statement = (is_array($taskStatements) && isset($taskStatements[0]) && is_array($taskStatements[0]))
		? $taskStatements[0]
		: [];
	$attempts = isset($statement['attempts']) && is_array($statement['attempts']) ? $statement['attempts'] : [];

	$feedbackFormData = getNested($payload, ['pages', 'feedback', 'formData'], []);
	$strategies = is_array($feedbackFormData) ? ($feedbackFormData['strategies'] ?? '') : '';

	$row = [
		'session_id' => scalarToString($payload['sessionId'] ?? ''),
		'prolific_id' => scalarToString($payload['prolificId'] ?? ''),
		'session_start' => scalarToString($payload['sessionStartTime'] ?? ''),
		'session_end' => scalarToString($payload['sessionEndTime'] ?? ''),
		'total_duration_ms' => scalarToString($payload['totalDuration'] ?? ''),
		'consent_decision' => scalarToString(getNested($payload, ['pages', 'consent', 'decision'], '')),
		'statement_id' => scalarToString($statement['statementId'] ?? ''),
		'original_text' => scalarToString($statement['originalText'] ?? ''),
		'original_label' => scalarToString($statement['originalLabel'] ?? ''),
		'original_confidence' => scalarToString($statement['originalConfidence'] ?? ''),
		'attempts_used' => scalarToString(count($attempts)),
		'max_attempts' => (string) CSV_MAX_ATTEMPTS,
	];

	for ($i = 1; $i <= CSV_MAX_ATTEMPTS; $i++) {
		$attempt = (isset($attempts[$i - 1]) && is_array($attempts[$i - 1])) ? $attempts[$i - 1] : [];
		$row['rewrite' . $i . '_text'] = scalarToString($attempt['rewriteText'] ?? '');
		$row['rewrite' . $i . '_label'] = scalarToString($attempt['rewriteLabel'] ?? '');
		$row['rewrite' . $i . '_confidence'] = scalarToString($attempt['rewriteConfidence'] ?? '');
		$row['rewrite' . $i . '_duration_ms'] = scalarToString($attempt['rewriteDurationMs'] ?? '');
	}

	$row['difficulty'] = scalarToString(is_array($feedbackFormData) ? ($feedbackFormData['difficulty'] ?? '') : '');
	$row['motivation'] = scalarToString(is_array($feedbackFormData) ? ($feedbackFormData['motivation'] ?? '') : '');
	$row['strategies'] = scalarToString($strategies);
	$row['feedback_text'] = scalarToString(is_array($feedbackFormData) ? ($feedbackFormData['feedbackText'] ?? '') : '');
	$row['received_at'] = $receivedAt;

	return $row;
}

function buildCsvString(array $row): string
{
	$handle = fopen('php://temp', 'r+');
	fputcsv($handle, array_keys($row), ',', '"', '\\');
	fputcsv($handle, array_values($row), ',', '"', '\\');
	rewind($handle);
	$csv = stream_get_contents($handle);
	fclose($handle);
	return $csv;
}

/**
 * @return array{duplicateSession: bool, backend: string}
 */
function persistToPostgres(
	array $payload,
	string $receivedAt,
	string $jsonObjectName,
	string $csvObjectName,
	array $csvRow
): array {
	$pdo = getPdoConnection();
	$pdo->beginTransaction();

	$sessionId = (string) $payload['sessionId'];
	$prolificId = (string) $payload['prolificId'];
	$payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES);
	$csvRowJson = json_encode($csvRow, JSON_UNESCAPED_SLASHES);

	if ($payloadJson === false || $csvRowJson === false) {
		throw new RuntimeException('Failed to encode JSON fields for PostgreSQL insert.');
	}

	$insert = $pdo->prepare(
		'INSERT INTO results
			(session_id, prolific_id, received_at, json_object_name, csv_object_name, payload_json, csv_row_json)
		 VALUES
			(:session_id, :prolific_id, CAST(:received_at AS timestamptz), :json_object_name, :csv_object_name, CAST(:payload_json AS jsonb), CAST(:csv_row_json AS jsonb))
		 ON CONFLICT (session_id) DO NOTHING'
	);

	$insert->bindValue(':session_id', $sessionId);
	$insert->bindValue(':prolific_id', $prolificId);
	$insert->bindValue(':received_at', $receivedAt);
	$insert->bindValue(':json_object_name', $jsonObjectName);
	$insert->bindValue(':csv_object_name', $csvObjectName);
	$insert->bindValue(':payload_json', $payloadJson);
	$insert->bindValue(':csv_row_json', $csvRowJson);
	$insert->execute();

	$inserted = $insert->rowCount() > 0;
	$pdo->commit();

	return [
		'duplicateSession' => !$inserted,
		'backend' => 'postgres',
	];
}

/**
 * @return array{duplicateSession: bool, backend: string}
 */
function persistToGCloud(string $encoded, string $csvString, string $jsonObjectName, string $csvObjectName): array
{
	$storage = new StorageClient(['keyFilePath' => getGcsCredentialsPath()]);
	$bucket  = $storage->bucket(getGcsBucketName());

	$duplicateSession = $bucket->object($jsonObjectName)->exists();

	if (!$duplicateSession) {
		$bucket->upload($encoded . PHP_EOL, ['name' => $jsonObjectName]);
		$bucket->upload($csvString,         ['name' => $csvObjectName]);
	}

	return [
		'duplicateSession' => $duplicateSession,
		'backend' => 'gcloud',
	];
}

/**
 * @return array{duplicateSession: bool, backend: string, fallbackUsed: bool}
 */
function persistWithConfiguredBackend(
	string $primaryBackend,
	string $fallbackBackend,
	array $payload,
	string $receivedAt,
	string $encoded,
	string $csvString,
	string $jsonObjectName,
	string $csvObjectName,
	array $csvRow
): array {
	$backendsToTry = [$primaryBackend];
	if ($fallbackBackend !== 'none') {
		$backendsToTry[] = $fallbackBackend;
	}

	$lastError = null;

	foreach ($backendsToTry as $index => $backend) {
		try {
			if ($backend === 'postgres') {
				$result = persistToPostgres($payload, $receivedAt, $jsonObjectName, $csvObjectName, $csvRow);
			} elseif ($backend === 'gcloud') {
				$result = persistToGCloud($encoded, $csvString, $jsonObjectName, $csvObjectName);
			} else {
				throw new RuntimeException('Unsupported storage backend: ' . $backend);
			}

			return [
				'duplicateSession' => $result['duplicateSession'],
				'backend' => $result['backend'],
				'fallbackUsed' => $index > 0,
			];
		} catch (\Throwable $e) {
			$lastError = $e;
		}
	}

	throw new RuntimeException(
		'Failed to persist session data via all configured backends: ' . ($lastError ? $lastError->getMessage() : 'unknown error')
	);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(204);
	exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	echo json_encode(['error' => 'Method not allowed. Use POST.']);
	exit;
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || trim($rawBody) === '') {
	http_response_code(400);
	echo json_encode(['error' => 'Request body is empty.']);
	exit;
}

$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
	http_response_code(400);
	echo json_encode(['error' => 'Invalid JSON payload.']);
	exit;
}

$sessionId  = isset($payload['sessionId'])  ? trim((string) $payload['sessionId'])  : '';
$prolificId = isset($payload['prolificId']) ? trim((string) $payload['prolificId']) : '';

if ($sessionId === '' || $prolificId === '') {
	http_response_code(422);
	echo json_encode([
		'error' => 'Missing required fields: sessionId and prolificId are required.'
	]);
	exit;
}

$safeSessionId  = preg_replace('/[^a-zA-Z0-9_-]/', '_', $sessionId);
$safeProlificId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $prolificId);

if ($safeSessionId === null || $safeProlificId === null) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to sanitize identifiers.']);
	exit;
}

$receivedAt = gmdate('c');
$fileName   = $safeProlificId . '_' . $safeSessionId;

$document = [
	'receivedAt' => $receivedAt,
	'payload'    => $payload,
];

$encoded = json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($encoded === false) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to encode payload for storage.']);
	exit;
}

$csvRow    = buildSessionCsvRow($payload, $receivedAt);
$csvString = buildCsvString($csvRow);

$jsonObjectName = 'sessions/' . $fileName . '.json';
$csvObjectName  = 'csv-rows/' . $fileName . '.csv';
$duplicateSession = false;
$backendUsed = '';
$fallbackUsed = false;
$primaryBackend = getStorageBackend();
$fallbackBackend = getFallbackStorageBackend($primaryBackend);

try {
	$result = persistWithConfiguredBackend(
		$primaryBackend,
		$fallbackBackend,
		$payload,
		$receivedAt,
		$encoded,
		$csvString,
		$jsonObjectName,
		$csvObjectName,
		$csvRow
	);

	$duplicateSession = $result['duplicateSession'];
	$backendUsed = $result['backend'];
	$fallbackUsed = $result['fallbackUsed'];
} catch (\Throwable $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to persist session data.', 'details' => $e->getMessage()]);
	exit;
}

echo json_encode([
	'success'          => true,
	'file'             => $jsonObjectName,
	'csvFile'          => $csvObjectName,
	'csvUpdated'       => !$duplicateSession,
	'duplicateSession' => $duplicateSession,
	'storageBackend'   => $backendUsed,
	'fallbackUsed'     => $fallbackUsed,
	'primaryBackend'   => $primaryBackend,
]);
