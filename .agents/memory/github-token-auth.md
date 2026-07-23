---
name: GitHub token pushes
description: Environment-specific guidance for pushing to GitHub when the Replit GitHub source-control credential is unavailable.
---

For repository pushes, the secure GitHub token may be available as an environment secret even when the built-in Git helper reports that no GitHub source-control credentials are configured. Authenticate HTTPS Git operations with an ephemeral Basic authorization header using the `x-access-token` username; never place the token in a remote URL or print it.

**Why:** The built-in helper and bearer-header authentication did not recognize the stored token, while the ephemeral Basic header worked without exposing the secret.

**How to apply:** Check that the secret exists, construct the header only inside the command, use it for fetch/push, and verify the remote commit afterward.