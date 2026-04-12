package io.github.nizos.tddguard.junit5.model;

import java.util.List;
import java.util.Objects;

/**
 * A group of tests sharing the same moduleId (typically a source file path).
 */
public final class TestModule {
    private final String moduleId;
    private final List<TestCase> tests;

    public TestModule(String moduleId, List<TestCase> tests) {
        this.moduleId = Objects.requireNonNull(moduleId, "moduleId must not be null");
        this.tests = Objects.requireNonNull(tests, "tests must not be null");
    }

    public String moduleId() {
        return moduleId;
    }

    public List<TestCase> tests() {
        return tests;
    }
}
