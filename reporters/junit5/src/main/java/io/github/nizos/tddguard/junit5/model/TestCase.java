package io.github.nizos.tddguard.junit5.model;

import java.util.List;
import java.util.Objects;

/**
 * A single test case result.
 * Use {@link #passed}, {@link #failed}, or {@link #skipped} factory methods
 * to construct instances with the correct shape.
 */
public final class TestCase {
    public enum State {
        PASSED("passed"),
        FAILED("failed"),
        SKIPPED("skipped");

        private final String jsonValue;

        State(String jsonValue) {
            this.jsonValue = jsonValue;
        }

        public String jsonValue() {
            return jsonValue;
        }
    }

    private final String name;
    private final String fullName;
    private final State state;
    private final List<TestError> errors;

    private TestCase(String name, String fullName, State state, List<TestError> errors) {
        this.name = Objects.requireNonNull(name, "name must not be null");
        this.fullName = Objects.requireNonNull(fullName, "fullName must not be null");
        this.state = Objects.requireNonNull(state, "state must not be null");
        this.errors = errors;
    }

    public static TestCase passed(String name, String fullName) {
        return new TestCase(name, fullName, State.PASSED, null);
    }

    public static TestCase failed(String name, String fullName, List<TestError> errors) {
        return new TestCase(name, fullName, State.FAILED, Objects.requireNonNull(errors, "errors must not be null"));
    }

    public static TestCase skipped(String name, String fullName) {
        return new TestCase(name, fullName, State.SKIPPED, null);
    }

    public String name() {
        return name;
    }

    public String fullName() {
        return fullName;
    }

    public State state() {
        return state;
    }

    public List<TestError> errors() {
        return errors;
    }
}
