# OpenTally Connect

AI-assisted integration with the hosted OpenTally billing ledger.

- [Download the CLI](https://github.com/opentallyprotocol/connect/releases/latest): Linux/macOS, amd64/arm64. Windows uses WSL and its Linux filesystem.
- [Agent Skill](skills/opentally-integrate/SKILL.md): install in your coding agent's supported skill directory, or give the instructions to your coding agent.
- [TypeScript adapter](integrations/typescript/index.ts) / [Python adapter](integrations/python/opentally_queue.py): thin wrappers around the installed CLI.
- [Service guide](https://opentally.linkex.ai/agent/guide.md) and [quickstart](https://developers.linkex.cc/docs/quickstart/#agent-integration).

## Install

Download your platform's `opentally-connect_*`, `SHA256SUMS`, `CONNECT-BINARY.txt`
and `THIRD-PARTY-NOTICES.txt` from the same GitHub release. Verify the binary's
SHA256 against that release's manifest before running it. The provided
`install-connect.sh ARTIFACT EXPECTED_SHA256 DESTINATION` verifies the digest and
refuses overwrite; it does not run the downloaded binary. Checksums are integrity
checks, not independent publisher signatures. Initial releases are not signed.

Run `opentally-connect help`. Then, for the hosted production service:

```sh
opentally-connect login -server https://opentally.linkex.ai -auth auth.json \
  -scope 'integration:read integration:preview pricing:publish credentials:create_ingest'
```

Open the returned URL and authorize your chosen workspace. Never paste passwords,
verification codes or tokens into a chat. Auth/credential/queue files contain
secrets or billing records: use a private local directory outside source control.
The authoritative guide above covers pricing, preflight, credential creation,
durable delivery, recovery and evidence verification. Production requires real
billing records; never relabel synthetic test traffic as live.

For remote MCP clients, connect `https://opentally.linkex.ai/mcp` and complete
OAuth. This does not itself grant access to your application source or deployment.
Client-specific authenticated ChatGPT/Claude acceptance is not yet claimed.

## License boundaries

`LICENSE` (MIT) applies to the Skill and thin adapter source, and this README.
`CONNECT-BINARY.txt` applies to CLI release binaries. `install-connect.sh` is
CC0-1.0, as marked in the script. Third-party dependency terms are shipped with
each release. The CLI and hosted service implementation source are private and
are not contained in this repository. No account credentials or billing data
belong in issues or pull requests.
