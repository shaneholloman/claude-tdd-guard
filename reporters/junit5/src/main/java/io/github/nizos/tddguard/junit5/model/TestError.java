package io.github.nizos.tddguard.junit5.model;

import java.util.Objects;

/**
 * Error information attached to a failed test.
 * The optional {@code stack} field is populated by later PRs (stack field).
 */
public final class TestError {
    private final String message;
    private final String stack;

    public TestError(String message) {
        this(message, null);
    }

    public TestError(String message, String stack) {
        this.message = Objects.requireNonNull(message, "message must not be null");
        this.stack = stack;
    }

    public String message() {
        return message;
    }

    public String stack() {
        return stack;
    }
}
