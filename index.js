#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const os = require("os");
const express = require("express");
const axios = require("axios"); // We added axios to make HTTP requests

const CONFIG_DIR = path.join(os.homedir(), ".insighta");
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");
const BASE_URL = "https://efficient-prosperity-production-d30a.up.railway.app";

// Helper: Save tokens
function saveCredentials(tokens) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(tokens, null, 2), {
    mode: 0o600,
  });
  console.log(`\n✅ Credentials securely saved to ${CREDENTIALS_FILE}`);
}

// Helper: Read tokens
function getCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error(
      '\n❌ No credentials found. Please run "insighta login" first.',
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8"));
}

program
  .name("insighta")
  .description("Insighta Labs+ CLI for Profile Intelligence")
  .version("1.0.0");

// COMMAND 1: LOGIN
program
  .command("login")
  .description("Authenticate with your Insighta Labs+ account")
  .action(async () => {
    console.log("Initiating OAuth flow...");
    const open = (await import("open")).default;
    const app = express();

    const server = app.listen(3000, async () => {
      console.log("⏳ Waiting for authentication in your browser...");
      await open(`${BASE_URL}/auth/github?cli=true`);
    });

    app.get("/callback", (req, res) => {
      const { access_token, refresh_token, role } = req.query;
      if (access_token) {
        saveCredentials({ access_token, refresh_token, role });
        res.send(
          '<h1 style="font-family: sans-serif; color: #22c55e;">Authentication Successful!</h1><p style="font-family: sans-serif;">You can close this window and return to your terminal.</p>',
        );
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
      } else {
        res
          .status(400)
          .send(
            '<h1 style="font-family: sans-serif; color: #ef4444;">Authentication Failed</h1>',
          );
        setTimeout(() => {
          server.close();
          process.exit(1);
        }, 1000);
      }
    });
  });

// COMMAND 2: PROFILES
program
  .command("profiles")
  .description("Fetch and search profiles from the Intelligence System")
  .option("-s, --search <query>", "Natural language search query")
  .option("-p, --page <number>", "Page number for pagination", "1")
  .action(async (options) => {
    const creds = getCredentials();

    try {
      console.log("🔍 Fetching profiles...\n");

      const response = await axios.get(`${BASE_URL}/api/profiles`, {
        headers: {
          Authorization: `Bearer ${creds.access_token}`,
          "X-API-Version": "1",
        },
        params: {
          search: options.search,
          page: options.page,
        },
      });

      // Output formatting: console.table creates a beautiful, modern terminal UI
      const profiles = response.data.data || response.data;
      if (profiles.length === 0) {
        console.log("No profiles found.");
      } else {
        console.table(profiles);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error(
          '❌ Unauthorized: Your token may have expired. Run "insighta login" again.',
        );
      } else if (error.response && error.response.status === 404) {
        console.error(
          `❌ Endpoint not found. Ensure your Stage 2 routing is live on Railway.`,
        );
      } else {
        console.error("❌ Error:", error.message);
      }
    }
  });

program.parse();
