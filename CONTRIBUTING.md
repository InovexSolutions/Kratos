# Contributing to Kratos Panel

Thank you for considering contributing to Kratos Panel! This document outlines the process for contributing to the project and how to submit changes.

## Development Environment

### Prerequisites

- Node.js 16+
- PostgreSQL database
- Stripe account for payment testing
- Pterodactyl panel instance for API integration testing

### Getting Started

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/kratos-panel.git
cd kratos-panel
```
3. Install dependencies:
```bash
npm install
# or with yarn
yarn install
```
4. Set up environment variables:
    - Copy `.env.example` to `.env` and fill in the required values.
    - Fill in the required configuration values for database, Pterodactyl, and Stripe.

5. Initialize the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

6. Start the development server:
```bash
npm run dev
# or with yarn
yarn dev
```

## Pull Request Process
1. Create a new branch for your feature or bug fix:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-you-are-fixing
```

2. Make your changes, following the coding standards and practices used throughout the project.

3. Add tests for your changes when applicable.

4. Update documentation to reflect any changes in functionality.

5. Run the test suite to ensure your changes don't break existing functionality:

```bash
npm run test
# or with yarn
yarn test
```

6. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
```bash
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue with payment processing"
```

7. Push your changes to your fork:
```bash
git push origin feature/your-feature-name
# or
git push origin fix/issue-you-are-fixing
```

8. Open a pull request against the `main` branch of the original repository.
    - Provide a clear description of your changes and reference any related issues.

    - Use the template provided in the pull request form.


9. Wait for feedback from the maintainers. Be open to suggestions and changes.


10. Once approved, your changes will be merged into the main branch.
    - You will be notified when your pull request is merged.


## Coding Standards
- Use TypeScript for type safety
- Follow ESLint rules configured in the project
- Write comments for complex logic
- Use Nuxt's built-in features and avoid custom solutions when possible
- Keep components small and focused on a single responsibility

## Testing

- Add unit tests for new functionality
- Ensure all existing tests pass before submitting a PR
- Test both development and production builds

## Documentation

- Update README.md with any new environment variables, configuration changes, or important notes
- Document new features with clear, concise explanations
- Include screenshots for UI changes when applicable

## Code of Conduct

Please note that this project has a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Questions?

If you have any questions, feel free to open an issue for discussion before starting work on a PR.

Thank you for contributing to Kratos Panel!