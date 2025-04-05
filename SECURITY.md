# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of Kratos Panel seriously. If you believe you've found a security vulnerability, please follow these steps:

1. **Do not disclose the vulnerability publicly**
2. **Email the details to**: [security@yourdomain.com]
3. Include the following details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes if available

## What to Expect

- We'll acknowledge receipt of your report within 48 hours
- We'll provide a more detailed response within 7 days, indicating the next steps in handling your report
- We'll keep you informed about our progress in addressing the issue
- After the issue is resolved, we may request your help in validating the fix

## Scope

This security policy applies to the latest stable release of Kratos Panel and its dependencies.

### In Scope

- Authentication vulnerabilities
- Authorization issues
- Data exposure
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Payment processing vulnerabilities
- API security issues

### Out of Scope

- Issues in outdated versions
- Issues in third-party applications or services
- Social engineering attacks
- Physical security attacks
- DoS/DDoS attacks

## Security Best Practices

When deploying Kratos Panel, follow these security best practices:

1. Keep all dependencies updated
2. Set strong admin credentials
3. Use HTTPS with a valid SSL certificate
4. Configure proper database security
5. Set up proper firewall rules
6. Implement rate limiting
7. Regularly backup your data
8. Review audit logs periodically

## Disclosure Policy

We follow responsible disclosure principles. Once an issue is fixed:

1. We'll release a security update
2. We'll document the issue in release notes without disclosing exploitation details
3. We'll credit you for the discovery if you wish

Thank you for helping keep Kratos Panel and our users safe!