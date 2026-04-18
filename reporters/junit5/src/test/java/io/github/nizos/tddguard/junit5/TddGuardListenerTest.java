package io.github.nizos.tddguard.junit5;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.platform.engine.TestDescriptor;
import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.engine.UniqueId;
import org.junit.platform.engine.support.descriptor.AbstractTestDescriptor;
import org.junit.platform.engine.support.descriptor.MethodSource;
import org.junit.platform.launcher.TestIdentifier;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TddGuardListenerTest {

    private static final String DATA_PATH = ".claude/tdd-guard/data/test.json";

    @Test
    void doesNothingWhenEnvVarIsNotSet(@TempDir Path tmp) {
        TddGuardListener listener = createListener(tmp, name -> null);

        listener.testPlanExecutionStarted(null);
        listener.executionFinished(testIdentifier("com.example.MyTest", "shouldWork"),
                TestExecutionResult.successful());
        listener.testPlanExecutionFinished(null);

        assertFalse(Files.exists(tmp.resolve(DATA_PATH)));
    }

    @Test
    void doesNothingWhenEnvVarIsEmpty(@TempDir Path tmp) {
        TddGuardListener listener = createListener(tmp, name -> "");

        listener.testPlanExecutionStarted(null);
        listener.testPlanExecutionFinished(null);

        assertFalse(Files.exists(tmp.resolve(DATA_PATH)));
    }

    @Test
    void writesTestJsonWhenConfigured(@TempDir Path tmp) throws IOException {
        TddGuardListener listener = createListener(tmp, name -> tmp.toString());

        listener.testPlanExecutionStarted(null);
        listener.executionFinished(testIdentifier("com.example.MyTest", "shouldWork"),
                TestExecutionResult.successful());
        listener.testPlanExecutionFinished(null);

        Path testJson = tmp.resolve(DATA_PATH);
        assertTrue(Files.exists(testJson));
        String content = Files.readString(testJson);
        assertTrue(content.contains("\"testModules\""));
        assertTrue(content.contains("\"state\": \"passed\""));
    }

    @Test
    void capturesFailedTestWithErrorMessage(@TempDir Path tmp) throws IOException {
        TddGuardListener listener = createListener(tmp, name -> tmp.toString());

        listener.testPlanExecutionStarted(null);
        listener.executionFinished(testIdentifier("com.example.MyTest", "shouldFail"),
                TestExecutionResult.failed(new AssertionError("expected true")));
        listener.testPlanExecutionFinished(null);

        String content = Files.readString(tmp.resolve(DATA_PATH));
        assertTrue(content.contains("\"state\": \"failed\""));
        assertTrue(content.contains("\"message\": \"expected true\""));
    }

    @Test
    void capturesSkippedTest(@TempDir Path tmp) throws IOException {
        TddGuardListener listener = createListener(tmp, name -> tmp.toString());

        listener.testPlanExecutionStarted(null);
        listener.executionSkipped(testIdentifier("com.example.MyTest", "pending"), "not implemented");
        listener.testPlanExecutionFinished(null);

        String content = Files.readString(tmp.resolve(DATA_PATH));
        assertTrue(content.contains("\"state\": \"skipped\""));
    }

    @Test
    void ignoresContainerEvents(@TempDir Path tmp) throws IOException {
        TddGuardListener listener = createListener(tmp, name -> tmp.toString());

        listener.testPlanExecutionStarted(null);
        listener.executionFinished(containerIdentifier("com.example.MyTest"),
                TestExecutionResult.successful());
        listener.testPlanExecutionFinished(null);

        String content = Files.readString(tmp.resolve(DATA_PATH));
        assertTrue(content.contains("\"testModules\": []"));
    }

    @Test
    void disablesGracefullyWhenProjectRootIsInvalid(@TempDir Path tmp) {
        Path elsewhere = tmp.resolve("elsewhere");
        ProjectRootResolver resolver = new ProjectRootResolver(
                name -> tmp.resolve("nonexistent").toString(),
                () -> elsewhere);
        TddGuardListener listener = new TddGuardListener(
                resolver, new TestJsonWriter(), name -> "set");

        listener.testPlanExecutionStarted(null);
        listener.testPlanExecutionFinished(null);

        assertFalse(Files.exists(tmp.resolve(DATA_PATH)));
    }

    private static TddGuardListener createListener(Path projectRoot,
                                                    java.util.function.Function<String, String> envAccessor) {
        ProjectRootResolver resolver = new ProjectRootResolver(
                name -> projectRoot.toString(),
                () -> projectRoot);
        return new TddGuardListener(resolver, new TestJsonWriter(), envAccessor);
    }

    private static TestIdentifier testIdentifier(String className, String methodName) {
        UniqueId id = UniqueId.root("test", className + "#" + methodName);
        TestDescriptor descriptor = new AbstractTestDescriptor(
                id, methodName, MethodSource.from(className, methodName)) {
            @Override
            public Type getType() {
                return Type.TEST;
            }
        };
        return TestIdentifier.from(descriptor);
    }

    private static TestIdentifier containerIdentifier(String className) {
        UniqueId id = UniqueId.root("engine", className);
        TestDescriptor descriptor = new AbstractTestDescriptor(id, className) {
            @Override
            public Type getType() {
                return Type.CONTAINER;
            }
        };
        return TestIdentifier.from(descriptor);
    }
}
