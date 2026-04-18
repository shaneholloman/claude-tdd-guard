<?php

declare(strict_types=1);

namespace TddGuard\PHPUnit\Tests;

use PHPUnit\Event\Code\Phpt;
use PHPUnit\Event\Code\TestDox;
use PHPUnit\Event\Code\TestMethod;
use PHPUnit\Event\TestData\TestDataCollection;
use PHPUnit\Framework\TestCase;
use PHPUnit\Metadata\MetadataCollection;
use Symfony\Component\Filesystem\Filesystem;
use TddGuard\PHPUnit\Storage;
use TddGuard\PHPUnit\TestResultCollector;

final class TestResultCollectorTest extends TestCase
{
    private string $tempDir;
    private Filesystem $filesystem;
    private string $originalCwd;

    #[\Override]
    protected function setUp(): void
    {
        $this->filesystem = new Filesystem();
        $this->tempDir = sys_get_temp_dir() . '/tdd-guard-collector-test-' . uniqid();
        $this->filesystem->mkdir($this->tempDir);
        $cwd = getcwd();
        $this->assertNotFalse($cwd);
        $this->originalCwd = $cwd;
        chdir($this->tempDir);
    }

    #[\Override]
    protected function tearDown(): void
    {
        chdir($this->originalCwd);
        $this->filesystem->remove($this->tempDir);
    }

    public function testThrowsWhenTestIsNotATestMethod(): void
    {
        // Given: A collector and a non-TestMethod Test (e.g. a .phpt file test)
        $storage = new Storage($this->tempDir);
        $collector = new TestResultCollector($storage, $this->tempDir);

        $phpt = new Phpt('/tmp/fake.phpt');

        // Then: addTestResult should throw LogicException
        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Expected');

        // When: Adding a non-TestMethod test
        $collector->addTestResult($phpt, 'passed');
    }

    public function testThrowsWhenJsonEncodeFails(): void
    {
        // Given: A collector with a test that carries an invalid UTF-8 message
        $storage = new Storage($this->tempDir);
        $collector = new TestResultCollector($storage, $this->tempDir);

        $test = new TestMethod(
            TestResultCollectorTest::class,
            'testFoo',
            __FILE__,
            1,
            new TestDox('Foo', 'test foo', 'test foo'),
            MetadataCollection::fromArray([]),
            TestDataCollection::fromArray([])
        );

        // Invalid UTF-8 byte sequence cannot be json_encoded
        $collector->addTestResult($test, 'failed', "\xc3\x28");

        // Then: saveResults should throw RuntimeException
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Failed to encode test results');

        // When: Saving results
        $collector->saveResults();
    }
}
