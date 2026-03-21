---
description: Set up TDD Guard for the current project. Detects the test framework, installs the appropriate reporter, and configures it.
disable-model-invocation: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# TDD Guard Setup

Set up TDD Guard for the current project. Your goal is to:

1. Identify the test framework(s) used in this project
2. Install the matching TDD Guard reporter
3. Configure the reporter in the test framework's config

## Reporter packages

| Framework | Reporter package                                         | Registry   |
| --------- | -------------------------------------------------------- | ---------- |
| Vitest    | tdd-guard-vitest                                         | npm        |
| Jest      | tdd-guard-jest                                           | npm        |
| Storybook | tdd-guard-storybook                                      | npm        |
| pytest    | tdd-guard-pytest                                         | PyPI       |
| PHPUnit   | tdd-guard/phpunit                                        | Packagist  |
| Go        | github.com/nizos/tdd-guard/reporters/go/cmd/tdd-guard-go | go install |
| Rust      | tdd-guard-rust                                           | crates.io  |

## Reporter configuration

All reporters write test results to `.claude/tdd-guard/data/test.json` relative to the project root.

**Vitest** — Add `VitestReporter` to the `reporters` array with project root path as constructor parameter.

```typescript
import { VitestReporter } from 'tdd-guard-vitest'

reporters: ['default', new VitestReporter('/absolute/path/to/project')]
```

**Jest** — Add reporter entry to the `reporters` array with `projectRoot` option.

```typescript
reporters: [
  'default',
  ['tdd-guard-jest', { projectRoot: '/absolute/path/to/project' }],
]
```

**Storybook** — Add `StorybookReporter` to the `reporters` array in `.storybook/test-runner.js` with `projectRoot` option.

```javascript
const { StorybookReporter } = require('tdd-guard-storybook')

reporters: [
  'default',
  [StorybookReporter, { projectRoot: '/absolute/path/to/project' }],
]
```

**pytest** — Set `tdd_guard_project_root` in pytest config (`pyproject.toml`, `pytest.ini`, or `setup.cfg`).

```toml
[tool.pytest.ini_options]
tdd_guard_project_root = "/absolute/path/to/project"
```

**PHPUnit** — Add extension (PHPUnit 10+) or listener (PHPUnit 9.x) to `phpunit.xml` with project root path.

```xml
<!-- PHPUnit 10+ -->
<extensions>
    <bootstrap class="TddGuard\PHPUnit\TddGuardExtension">
        <parameter name="projectRoot" value="/absolute/path/to/project"/>
    </bootstrap>
</extensions>

<!-- PHPUnit 9.x -->
<listeners>
    <listener class="TddGuard\PHPUnit\TddGuardListener">
        <arguments>
            <string>/absolute/path/to/project</string>
        </arguments>
    </listener>
</listeners>
```

**Go** — Add a test target using the piped command below. Update an existing Makefile, Taskfile, or similar build system if one exists.

```bash
go test -json ./... 2>&1 | tdd-guard-go -project-root /absolute/path/to/project
```

**Rust** — Add a test target using the piped command below. Update an existing Makefile, Taskfile, or similar build system if one exists.

```bash
cargo nextest run 2>&1 | tdd-guard-rust --project-root /absolute/path/to/project --passthrough
```

## Guidelines

Your scope is limited to installing and configuring a TDD Guard reporter. Do not make changes beyond that.

- **Always use absolute paths** when configuring the project root in reporters.
- **Do not modify the project's dependency files** (package.json, lock files, etc.) when possible. Prefer global installs to avoid friction in team projects.
- **Do not install, update, or modify test frameworks**, build tools, or any other project dependencies. Only install the TDD Guard reporter itself.
- **Do not modify existing test configuration** beyond adding the reporter. If existing configuration makes it difficult to add the reporter cleanly, inform the user and let them decide.
- **If a TDD Guard reporter is already configured**, inform the user and stop.
- **If multiple frameworks are detected**, ask the user which to configure.
- **If something goes wrong or is unclear**, inform the user rather than attempting to fix it. Do not install additional packages or make extra changes to resolve issues.
