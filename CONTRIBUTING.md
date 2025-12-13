# Contributing to Self-Claim Link

We welcome contributions to the Self-Claim Link project! By contributing, you help us improve the application for everyone. Please take a moment to review this document to understand how you can contribute.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

## How Can I Contribute?

There are several ways you can contribute to this project:

### Reporting Bugs

- Ensure the bug hasn't already been reported by searching on GitHub Issues.
- If you can't find an open issue addressing the problem, open a new one.
- Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

- Before creating enhancement suggestions, please check the issue list to see if your idea has already been suggested.
- When creating an enhancement suggestion, provide a **clear and concise description** of the feature, including **why it's needed** and **how it would be used**.

### Writing Code

1.  **Fork the repository:** Start by forking the `self-claim-link` repository to your GitHub account.
2.  **Clone your fork:**
    ```bash
    git clone https://github.com/your-username/self-claim-link.git
    cd self-claim-link
    ```
3.  **Create a new branch:** For each new feature or bug fix, create a new branch. Use a descriptive name like `feature/add-user-profile` or `bugfix/fix-login-error`.
    ```bash
    git checkout -b your-new-branch-name
    ```
4.  **Set up your development environment:**
    ```bash
    npm install --legacy-peer-deps
    npm run dev
    ```
5.  **Make your changes:**
    -   Adhere to the existing coding style.
    -   Write clear, concise, and well-documented code.
    -   Ensure your changes pass all existing tests and add new tests for new functionality.
6.  **Commit your changes:** Write clear and descriptive commit messages.
    ```bash
    git add .
    git commit -m "feat: Add new user profile feature"
    ```
7.  **Push your branch:**
    ```bash
    git push origin your-new-branch-name
    ```
8.  **Create a Pull Request (PR):**
    -   Go to the original `self-claim-link` repository on GitHub.
    -   You should see a prompt to create a new pull request from your recently pushed branch.
    -   Fill out the PR template with a clear description of your changes, referencing any related issues.

## Styleguides

### Git Commit Messages

-   Use the "Conventional Commits" specification.
-   Start with a type (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`).
-   Follow the type with a colon and a space, then a concise description of the change.
-   Example: `feat: Add new product filtering option`

### JavaScript/TypeScript

-   Follow ESLint rules configured in `.eslintrc.json`.
-   Use Prettier for code formatting.

## Code Review Process

-   Once you submit a pull request, project maintainers will review your code.
-   Be prepared to respond to comments and make changes as requested.
-   We aim to respond to PRs within a reasonable timeframe.

## Questions?

If you have any questions, feel free to open an issue or reach out to the maintainers.