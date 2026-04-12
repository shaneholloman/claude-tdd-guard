package io.github.nizos.tddguard.junit5;

import java.nio.file.Path;
import java.util.Objects;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Resolves the project root path according to ADR-009 and ADR-010.
 *
 * <p>Precedence (ADR-010):
 * <ol>
 *   <li>Explicit option (constructor-provided path)</li>
 *   <li>{@code TDD_GUARD_PROJECT_ROOT} environment variable</li>
 *   <li>Error when neither is configured (no silent cwd fallback)</li>
 * </ol>
 *
 * <p>Path handling (ADR-009):
 * <ul>
 *   <li>Absolute and relative paths are both accepted</li>
 *   <li>Relative paths resolve against the process cwd</li>
 *   <li>{@code ..} segments are normalized</li>
 *   <li>The cwd must be equal to or a descendant of the resolved root</li>
 * </ul>
 */
public final class ProjectRootResolver {
    public static final String ENV_VAR = "TDD_GUARD_PROJECT_ROOT";

    private final Function<String, String> envAccessor;
    private final Supplier<Path> cwdSupplier;

    public ProjectRootResolver() {
        this(System::getenv, () -> Path.of("").toAbsolutePath());
    }

    ProjectRootResolver(Function<String, String> envAccessor, Supplier<Path> cwdSupplier) {
        this.envAccessor = Objects.requireNonNull(envAccessor, "envAccessor must not be null");
        this.cwdSupplier = Objects.requireNonNull(cwdSupplier, "cwdSupplier must not be null");
    }

    /**
     * Resolves the project root.
     *
     * @param explicitPath optional explicit path; if null, falls back to the env var
     * @return the resolved absolute path
     * @throws IllegalStateException if no project root is configured, or if the cwd
     *                               is not within the resolved root
     */
    public Path resolve(String explicitPath) {
        String configured = (explicitPath != null && !explicitPath.isEmpty())
                ? explicitPath
                : envAccessor.apply(ENV_VAR);

        if (configured == null || configured.isEmpty()) {
            throw new IllegalStateException(
                    "Project root is not configured. Set the "
                            + ENV_VAR + " environment variable or pass an explicit path.");
        }

        Path cwd = cwdSupplier.get().toAbsolutePath().normalize();
        Path resolved = cwd.resolve(configured).normalize();

        if (!isWithinOrEqual(cwd, resolved)) {
            throw new IllegalStateException(
                    "Current working directory (" + cwd
                            + ") is not within the resolved project root (" + resolved + ").");
        }

        return resolved;
    }

    private static boolean isWithinOrEqual(Path cwd, Path root) {
        return cwd.equals(root) || cwd.startsWith(root);
    }
}
