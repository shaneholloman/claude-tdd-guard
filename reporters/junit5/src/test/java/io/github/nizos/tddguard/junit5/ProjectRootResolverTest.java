package io.github.nizos.tddguard.junit5;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProjectRootResolverTest {

    @Test
    void throwsWhenNeitherOptionNorEnvVarConfigured(@TempDir Path tmp) {
        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> tmp);
        assertThrows(IllegalStateException.class, () -> resolver.resolve(null));
    }

    @Test
    void usesExplicitPathOverEnvVar(@TempDir Path tmp) {
        Path explicit = tmp.resolve("explicit");
        Path fromEnv = tmp.resolve("fromEnv");

        ProjectRootResolver resolver = new ProjectRootResolver(
                name -> fromEnv.toString(),
                () -> explicit);

        assertEquals(explicit.toAbsolutePath().normalize(),
                resolver.resolve(explicit.toString()));
    }

    @Test
    void fallsBackToEnvVarWhenNoExplicitPath(@TempDir Path tmp) {
        ProjectRootResolver resolver = new ProjectRootResolver(
                name -> tmp.toString(),
                () -> tmp);

        assertEquals(tmp.toAbsolutePath().normalize(), resolver.resolve(null));
    }

    @Test
    void acceptsRelativePaths(@TempDir Path tmp) {
        Path nested = tmp.resolve("nested");
        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> nested);

        Path resolved = resolver.resolve("..");

        assertEquals(tmp.toAbsolutePath().normalize(), resolved);
    }

    @Test
    void acceptsAbsolutePaths(@TempDir Path tmp) {
        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> tmp);

        Path resolved = resolver.resolve(tmp.toAbsolutePath().toString());

        assertEquals(tmp.toAbsolutePath().normalize(), resolved);
    }

    @Test
    void rejectsWhenCwdIsOutsideResolvedRoot(@TempDir Path tmp) {
        Path root = tmp.resolve("root");
        Path cwd = tmp.resolve("elsewhere");

        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> cwd);

        assertThrows(IllegalStateException.class,
                () -> resolver.resolve(root.toAbsolutePath().toString()));
    }

    @Test
    void acceptsWhenCwdEqualsResolvedRoot(@TempDir Path tmp) {
        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> tmp);

        Path resolved = resolver.resolve(tmp.toAbsolutePath().toString());

        assertEquals(tmp.toAbsolutePath().normalize(), resolved);
    }

    @Test
    void acceptsWhenCwdIsDescendantOfRoot(@TempDir Path tmp) {
        Path cwd = tmp.resolve("a").resolve("b");
        ProjectRootResolver resolver = new ProjectRootResolver(name -> null, () -> cwd);

        Path resolved = resolver.resolve(tmp.toAbsolutePath().toString());

        assertEquals(tmp.toAbsolutePath().normalize(), resolved);
    }
}
