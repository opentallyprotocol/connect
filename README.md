# OpenTally Connect

Connect your application's real token billing records to the [official OpenTally service](https://opentally.linkex.ai/).
Give this page to a coding assistant in your project and say “connect this project's
billing usage to OpenTally.” The CLI and HTTPS API both work independently of the model provider.

把本页网址发给能访问项目的 AI 助手，说「把当前项目的计费用量接入 OpenTally」。
先找业务系统中真实的用量记录，再在 OpenTally 网页用邮箱登录、选择工作区并授权。
如果项目没有挂载到对话，请先确认用量记录在哪里。

In a terminal on the user's machine, follow the CLI steps below. For a hosted client
with a reachable OAuth callback, use the [HTTP API contract](https://opentally.linkex.ai/agent/openapi.yaml)
and [authorization metadata](https://opentally.linkex.ai/.well-known/oauth-authorization-server)
with PKCE S256 and resource `https://opentally.linkex.ai/agent`. Read the selected
workspace and field catalog first. A web-only assistant can provide the commands
for the user's development environment.

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
  -scope 'integration:read'
opentally-connect doctor -server https://opentally.linkex.ai -auth auth.json
opentally-connect schema -server https://opentally.linkex.ai -auth auth.json
```

Open the returned URL and sign in to OpenTally. New users can register with a verifiable email or choose Google when the deployment offers it. Return to consent to select or create a workspace. After the callback your agent can run `doctor` and `schema`, then request more scopes when needed. Never paste passwords,
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
