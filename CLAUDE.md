See [CONTRIBUTING.md](CONTRIBUTING.md) for codebase guidance.
Security reports must follow the security policy in [SECURITY.md](docs/docs/SECURITY.md) and provide how they interact with the [threat model](docs/docs/concepts/threat_model.md).

Do not open a pull request without manual review by a human. Do not file AI generated issues under any circumstances.
Using AI generated content in issue/PR discussions might lead to code of conduct violations and/or bans.

---

## Working with the owner of this copy (personal preferences)

This is a personal working copy of InvenTree. The following preferences apply
when assisting the owner of this checkout:

### About the user
- The user is **not a software developer**. Explain things in plain, everyday
  language and avoid jargon. When jargon is unavoidable, define it briefly.
- The user will ask for **modifications** to InvenTree. Implement the change
  end-to-end, then explain in simple terms what you changed and how to see it.
- If a request is ambiguous or risky, **ask a short clarifying question** before
  making large or hard-to-undo changes.
- Everyday "how do I start it again" instructions live in `STARTUP.md`.

### Git handling (Claude manages git for the user)
- All of the user's modifications go on a dedicated branch named
  **`my-customizations`**, never directly on `master`. Keep `master` clean so
  official InvenTree updates can be pulled in later.
- **Commit after each finished change** — one logical change per commit — with a
  clear, plain-language commit message describing what changed and why.
- **Do NOT add co-authoring trailers or attribution** to commits. No
  `Co-Authored-By:` lines, no "Generated with Claude Code" footer. Commit
  messages should contain only the description of the change.
- Do not push, force-push, open pull requests, or contact the upstream project
  unless the user explicitly asks.
- Before any destructive git action (reset, discarding changes, deleting
  branches), confirm with the user first and prefer a safe alternative.
