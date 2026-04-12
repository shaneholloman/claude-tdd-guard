package io.github.nizos.tddguard.junit5.model;

import java.util.List;
import java.util.Objects;

/**
 * Top-level test result written to test.json.
 * Matches the TDD Guard canonical schema defined in
 * src/contracts/schemas/reporterSchemas.ts.
 */
public final class TestResult {
    private final List<TestModule> testModules;

    public TestResult(List<TestModule> testModules) {
        this.testModules = Objects.requireNonNull(testModules, "testModules must not be null");
    }

    public List<TestModule> testModules() {
        return testModules;
    }
}
