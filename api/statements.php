<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$csvPath = __DIR__ . '/../data/hippocorpus_test_truncated_80_100.csv';

if (!file_exists($csvPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'CSV file not found']);
    exit;
}

$handle = fopen($csvPath, 'r');
if ($handle === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not open CSV']);
    exit;
}

$header = fgetcsv($handle, 0, ',', '"', '\\');
if ($header === false) {
    fclose($handle);
    http_response_code(500);
    echo json_encode(['error' => 'CSV header missing']);
    exit;
}

$indexCol = array_search('index', $header, true);
$textCol = array_search('text_truncated', $header, true);

if ($indexCol === false || $textCol === false) {
    fclose($handle);
    http_response_code(500);
    echo json_encode(['error' => 'Required columns missing: index, text_truncated']);
    exit;
}

$rows = [];
while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
    $index = isset($row[$indexCol]) ? trim((string) $row[$indexCol]) : '';
    $text = isset($row[$textCol]) ? trim((string) $row[$textCol]) : '';

    if ($index !== '' && $text !== '') {
        $rows[] = [
            'index' => $index,
            'text_truncated' => $text,
        ];
    }
}

fclose($handle);
echo json_encode($rows, JSON_UNESCAPED_SLASHES);
