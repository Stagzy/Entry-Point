# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Entry Point, please **do not** open a public issue on GitHub. Instead, please report it privately to protect our users.

### How to Report

Please email your security concern directly instead of using public issue tracker. Include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any proof-of-concept code (if applicable)

We will acknowledge your report within 48 hours and provide a timeline for addressing the vulnerability.

## Supported Versions

- **Latest version**: Receives security patches
- **Previous version**: May receive critical security patches

Older versions are not actively supported. We recommend always upgrading to the latest version.

## Security Best Practices

When using Entry Point in production:

1. **Environment Variables**: Never commit `.env` files or secrets to the repository
2. **API Keys**: Rotate Stripe, Supabase, and other third-party API keys regularly
3. **Dependencies**: Keep all dependencies up to date by running `npm update`
4. **Code Review**: Have security-sensitive code reviewed before merging
5. **Testing**: Write and run tests for security-critical functionality
6. **HTTPS**: Always use HTTPS in production
7. **Authentication**: Implement proper authentication and authorization checks

## Security Updates

We will publish security updates as soon as they're available. Notable security updates will be announced in the GitHub releases.

## Third-Party Vulnerabilities

If you find a vulnerability in a third-party dependency, please:
1. Report it directly to the dependency maintainers
2. Check if an updated version is available
3. File an issue in our repository if we're still using a vulnerable version

## PII and Sensitive Data

Entry Point handles:
- User authentication credentials (via Supabase)
- Payment information (via Stripe - never stored directly)
- Email addresses and user profiles
- Geographic location data (for compliance)

We take the protection of this data seriously and follow industry best practices for handling sensitive information.

## Thank You

Thank you for helping keep Entry Point and its users safe!
