# Contributing to Entry Point

Thank you for your interest in contributing to Entry Point! We welcome contributions from the community and are excited to collaborate with you.

## How to Contribute

### Reporting Bugs
- Before submitting a bug report, check the issue list to avoid duplicates
- Include a clear title and description
- Provide a code sample or executable test case demonstrating the issue
- Describe the observed behavior and what you expected to see
- Include your environment details (OS, Node version, npm version)

### Suggesting Enhancements
- Use a clear, descriptive title
- Provide a detailed description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Explain why this enhancement would be useful
- List some other applications where this enhancement exists

### Code Contribution Process

1. **Fork the repository** and clone your fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/Entry-Point.git
   cd Entry-Point
   ```

2. **Create a new branch** for your feature or fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up your development environment**
   ```bash
   npm install
   # Copy .env.example to .env and fill in your local values
   cp supabase/.env.example supabase/.env
   ```

4. **Make your changes**
   - Follow the existing code style
   - Write clear, concise commit messages
   - Include comments for complex logic
   - Update tests if applicable

5. **Test your changes**
   - Run the app locally: `npm start`
   - Test on both Android and iOS if possible
   - Verify existing functionality isn't broken

6. **Commit and push your changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots if relevant
   - Ensure CI checks pass

## Code Style Guidelines

- Use JavaScript/React best practices
- Follow existing naming conventions
- Components should be functional components with Hooks
- Use meaningful variable and function names
- Comment complex logic and edge cases
- Keep functions focused and reusable

## Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Environment Variables
Create a `supabase/.env` file based on `supabase/.env.example` with your local development credentials.

```bash
EXPO_PUBLIC_SUPABASE_URL=your_local_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Running Locally
```bash
npm install
npm start
```

## Pull Request Process

1. Ensure all tests pass and there are no lint errors
2. Update the README.md with details of changes if applicable
3. Increase version numbers following semantic versioning
4. Your PR will be reviewed by maintainers
5. Once approved, your PR will be merged

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Questions?

Feel free to:
- Open an issue with your question
- Start a discussion in GitHub Discussions
- Check existing issues and documentation

Thank you for contributing! 🙌
