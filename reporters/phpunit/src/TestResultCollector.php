<?php

declare(strict_types=1);

namespace TddGuard\PHPUnit;

use PHPUnit\Event\Code\Test;
use PHPUnit\Event\Code\TestMethod;

final class TestResultCollector
{
    private array $testResults = [];
    private Storage $storage;
    private string $projectRoot;

    public function __construct(Storage $storage, string $projectRoot)
    {
        $this->storage = $storage;
        $this->projectRoot = rtrim($projectRoot, DIRECTORY_SEPARATOR);
    }

    public function addTestResult(Test $test, string $state, ?string $message = null): void
    {
        if (!$test instanceof TestMethod) {
            throw new \LogicException(sprintf(
                'Expected %s, got %s',
                TestMethod::class,
                $test::class
            ));
        }

        $testName = $test->name();
        $className = $test->className();
        $fullName = $className . '::' . $testName;

        $result = [
            'name' => $testName,
            'fullName' => $fullName,
            'state' => $state,
        ];

        if ($message !== null && ($state === 'failed' || $state === 'errored')) {
            $result['errors'] = [
                ['message' => $message],
            ];
        }

        try {
            $reflection = new \ReflectionClass($className);
            $fileName = $reflection->getFileName();
            $moduleId = $fileName === false
                ? str_replace('\\', '/', $className) . '.php'
                : $this->getRelativePath($fileName);
        } catch (\ReflectionException) {
            $moduleId = str_replace('\\', '/', $className) . '.php';
        }

        $this->testResults[] = [
            'test' => $result,
            'module' => $moduleId,
        ];
    }

    private function getRelativePath(string $absolutePath): string
    {
        if (str_starts_with($absolutePath, $this->projectRoot)) {
            $relativePath = substr($absolutePath, strlen($this->projectRoot) + 1);

            return str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
        }

        $cwd = getcwd();
        if ($cwd !== false && str_starts_with($absolutePath, $cwd)) {
            $relativePath = substr($absolutePath, strlen($cwd) + 1);

            return str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
        }

        return basename($absolutePath);
    }

    public function saveResults(): void
    {
        if (empty($this->testResults)) {
            return;
        }

        $modules = [];
        $hasFailures = false;

        foreach ($this->testResults as $item) {
            $moduleId = $item['module'];
            if (!isset($modules[$moduleId])) {
                $modules[$moduleId] = [
                    'moduleId' => $moduleId,
                    'tests' => [],
                ];
            }

            // Normalize 'errored' to 'failed'
            $test = $item['test'];
            if ($test['state'] === 'errored') {
                $test['state'] = 'failed';
            }
            $modules[$moduleId]['tests'][] = $test;

            if ($test['state'] === 'failed') {
                $hasFailures = true;
            }
        }

        $output = [
            'testModules' => array_values($modules),
            'reason' => $hasFailures ? 'failed' : 'passed',
        ];

        $encoded = json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($encoded === false) {
            throw new \RuntimeException('Failed to encode test results: ' . json_last_error_msg());
        }

        $this->storage->saveTest($encoded);
    }
}
