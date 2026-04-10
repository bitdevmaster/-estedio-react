# Security Policy

## Supported Versions

Security fixes are provided for the latest minor line.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1.0 | No        |

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues.

Use one of these private channels:

1. GitHub Security Advisories (preferred):
   - Open a private report from the repository Security tab.
2. If Security Advisories are unavailable, contact the maintainers privately through the repository owner contact listed in package metadata.

When reporting, include:

- A clear description of the issue.
- Affected package version(s).
- Reproduction steps or proof of concept.
- Impact assessment (what an attacker can do).
- Any suggested remediation.

## Response Process

- Initial acknowledgment target: within 3 business days.
- Triage and severity assessment target: within 7 business days.
- Fix timeline depends on severity and complexity.

Severity guidance:

- Critical/High: prioritized hotfix release.
- Medium: patch in next scheduled release.
- Low: fix when practical.

## Disclosure Policy

This project follows coordinated disclosure:

1. Report is received privately.
2. Maintainers validate and assess impact.
3. A fix is prepared and released.
4. Public disclosure occurs after fix availability.

## Scope

This policy covers:

- Source code under src.
- Published package artifacts for @estedio/react.
- Adapter entry points:
  - @estedio/react/redux
  - @estedio/react/zustand
  - @estedio/react/tanstack-query

Out of scope:

- Vulnerabilities only affecting unsupported versions.
- Issues caused solely by downstream app misconfiguration.
- Third-party dependency vulnerabilities with no available upstream fix or project-level mitigation.

## Security Best Practices for Consumers

- Keep @estedio/react and all peer dependencies updated.
- Use strong storage secrets in production.
- Avoid storing sensitive tokens in browser-accessible storage when a safer architecture is available.
- Run dependency and static analysis scans in CI.
