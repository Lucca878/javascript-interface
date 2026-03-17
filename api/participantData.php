<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

const CSV_MAX_ATTEMPTS = 10;

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

function appendSessionCsvRow(string $csvPath, array $row): array
{
	$handle = fopen($csvPath, 'c+');
	if ($handle === false) {
		throw new RuntimeException('Could not open CSV file for writing.');
	}

	$updated = false;
	$duplicate = false;

	try {
		if (!flock($handle, LOCK_EX)) {
			throw new RuntimeException('Could not lock CSV file.');
		}

		rewind($handle);
		$header = fgetcsv($handle, 0, ',', '"', '\\');

		if ($header === false) {
			$header = array_keys($row);
			fputcsv($handle, $header, ',', '"', '\\');
		}

		$sessionIdIndex = array_search('session_id', $header, true);
		if ($sessionIdIndex === false) {
			throw new RuntimeException('CSV header missing session_id column.');
		}

		while (($existing = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
			if (isset($existing[$sessionIdIndex]) && (string) $existing[$sessionIdIndex] === (string) $row['session_id']) {
				$duplicate = true;
				break;
			}
		}

		if (!$duplicate) {
			fseek($handle, 0, SEEK_END);
			$ordered = [];
			foreach ($header as $column) {
				$ordered[] = $row[$column] ?? '';
			}
			fputcsv($handle, $ordered, ',', '"', '\\');
			$updated = true;
		}

		fflush($handle);
		flock($handle, LOCK_UN);
	} finally {
		fclose($handle);
	}

	return ['updated' => $updated, 'duplicate' => $duplicate];
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

$sessionId = isset($payload['sessionId']) ? trim((string) $payload['sessionId']) : '';
$prolificId = isset($payload['prolificId']) ? trim((string) $payload['prolificId']) : '';

if ($sessionId === '' || $prolificId === '') {
	http_response_code(422);
	echo json_encode([
		'error' => 'Missing required fields: sessionId and prolificId are required.'
	]);
	exit;
}

$safeSessionId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $sessionId);
$safeProlificId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $prolificId);

if ($safeSessionId === null || $safeProlificId === null) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to sanitize identifiers.']);
	exit;
}

$sessionsDir = __DIR__ . '/../data/sessions';
if (!is_dir($sessionsDir) && !mkdir($sessionsDir, 0775, true) && !is_dir($sessionsDir)) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to create data directory.']);
	exit;
}

$receivedAt = gmdate('c');
$fileName = $safeProlificId . '_' . $safeSessionId . '.json';
$filePath = $sessionsDir . '/' . $fileName;

$document = [
	'receivedAt' => $receivedAt,
	'payload' => $payload,
];

$encoded = json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($encoded === false) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to encode payload for storage.']);
	exit;
}

$bytesWritten = file_put_contents($filePath, $encoded . PHP_EOL, LOCK_EX);
if ($bytesWritten === false) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to persist session data.']);
	exit;
}

$exportsDir = __DIR__ . '/../data/exports';
if (!is_dir($exportsDir) && !mkdir($exportsDir, 0775, true) && !is_dir($exportsDir)) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to create exports directory.']);
	exit;
}

$csvPath = $exportsDir . '/sessions.csv';
$csvRow = buildSessionCsvRow($payload, $receivedAt);

try {
	$csvResult = appendSessionCsvRow($csvPath, $csvRow);
} catch (RuntimeException $e) {
	http_response_code(500);
	echo json_encode(['error' => 'Failed to append CSV row.', 'details' => $e->getMessage()]);
	exit;
}

echo json_encode([
	'success' => true,
	'file' => 'data/sessions/' . $fileName,
	'bytesWritten' => $bytesWritten,
	'csvFile' => 'data/exports/sessions.csv',
	'csvUpdated' => $csvResult['updated'],
	'duplicateSession' => $csvResult['duplicate'],
]);
