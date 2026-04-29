# Insighta Labs+ CLI

A globally installable, command-line interface for the Insighta Labs+ Profile Intelligence System. Built with Node.js, this tool allows analysts to authenticate via OAuth and query the database directly from their terminal.

## System Architecture

- **Framework:** Node.js using `commander` for command routing.
- **Networking:** `axios` for authenticated API communication.
- **Local Server:** `express` for temporary localhost callback handling during the OAuth flow.

## CLI Usage

### Installation

Clone the repository and link it globally to your local machine:

```bash
npm install
npm link
Commands
1. Authenticate
Initiates the local OAuth flow.

Bash
insighta login
2. Fetch Profiles
Retrieves the database records. Supports natural language search and pagination.

Bash
insighta profiles --search "female in Nigeria" --page 1
Authentication Flow & Token Handling
This CLI utilizes a secure Localhost Callback Flow:

Running insighta login spins up a temporary Express server on port 3000.

The CLI forcefully opens the user's default web browser to the live backend OAuth gateway.

Upon successful GitHub authentication, the backend redirects back to http://localhost:3000/callback with the access and refresh tokens.

The Express server intercepts the tokens, writes them to the local vault, and instantly shuts down.

Secure Storage Approach
Credentials are never stored in the project directory.

Tokens are parsed and written directly to ~/.insighta/credentials.json (the user's hidden home directory).

The CLI enforces strict file permissions (mode: 0o600), guaranteeing that only the current operating system user can read or modify the authentication keys.
```
