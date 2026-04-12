# TDD Guard JUnit5 Reporter

JUnit5 TestExecutionListener that captures test results for TDD Guard validation.

## Requirements

- JDK 17+
- JUnit 5 (Jupiter)
- [TDD Guard](https://github.com/nizos/tdd-guard)

## Installation

Planned distribution: Maven Central (published by the maintainer).

Gradle:

```kotlin
testImplementation("io.github.nizos:tdd-guard-junit5:0.1.0")
```

Maven:

```xml
<dependency>
    <groupId>io.github.nizos</groupId>
    <artifactId>tdd-guard-junit5</artifactId>
    <version>0.1.0</version>
    <scope>test</scope>
</dependency>
```

## Usage

The listener registers automatically via the JUnit Platform SPI. Running `./gradlew test` or `mvn test` is enough once the dependency is on the test classpath.

## Configuration

### Project Root Configuration

Set the `TDD_GUARD_PROJECT_ROOT` environment variable to your project root:

```bash
export TDD_GUARD_PROJECT_ROOT="/absolute/path/to/project/root"
```

Or use a relative path, which resolves against the test runner's cwd.

### Configuration Rules

- Absolute and relative paths are both accepted (per ADR-009)
- Current directory must be within the configured project root
- Errors when neither an explicit path nor the env var is configured (per ADR-010)

## Development

```bash
./gradlew test
```

## More Information

- Test results are saved to `.claude/tdd-guard/data/test.json`
- See [TDD Guard documentation](https://github.com/nizos/tdd-guard) for complete setup

## License

MIT
