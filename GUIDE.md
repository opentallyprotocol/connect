# 对接 OpenTally / Integrate OpenTally

给助手本服务的网址并说「帮我对接 OpenTally」即可开始。这里接入的是用户的业务项目。先确认能访问哪个项目的用量记录或计费 outbox；默认使用 CLI 或 HTTPS API，无需在模型的工作区查找安装入口。用用户指定的网址作为服务 origin，读取 [capabilities](https://opentally.linkex.ai/agent/capabilities)，检查 `enabled`。接入第 6 代 token 用量需要业务系统里的客户归属、用量和约定价目。用户在 OpenTally 网页完成邮箱验证、选择工作区和授权。能执行命令的助手可以继续配置与验证；只能阅读网页的助手可以解释所需步骤并给出可执行命令。

Use the origin supplied by the user. Resolve service paths against that origin. Read [capabilities](https://opentally.linkex.ai/agent/capabilities) first; proceed with authorization when `enabled` is true. Choose the route supported by your environment:

- **Shell on the user's machine.** Use the published [OpenTally Connect CLI and install instructions](https://github.com/opentallyprotocol/connect#install). Download the Linux or macOS binary matching the machine (amd64 or arm64), verify it against the same release's SHA256SUMS, then install it. On Windows use WSL and its Linux filesystem. The [public releases](https://github.com/opentallyprotocol/connect/releases) are available independently of the optional same-origin CLI mirror. Keep a private working directory outside the repository. Set OT_SERVER to the user-selected origin and run:

  ```sh
  opentally-connect login -server "$OT_SERVER" -auth auth.json -scope integration:read
  opentally-connect doctor -server "$OT_SERVER" -auth auth.json
  opentally-connect schema -server "$OT_SERVER" -auth auth.json
  ```

  During login, show the user the authorization URL and keep the CLI running. The user's browser must be able to reach the CLI's loopback listener. After consent, check that doctor identifies the selected tenant and schema returns generation 6 and its input fields.
- **HTTPS client with a reachable OAuth callback.** Use the [HTTP API contract](https://opentally.linkex.ai/agent/openapi.yaml) and [authorization server metadata](https://opentally.linkex.ai/.well-known/oauth-authorization-server). Register one exact callback as a public client, then start the authorization-code flow with a random state, PKCE S256, scope `integration:read` and resource `ORIGIN/agent`. Validate state and issuer on return. Exchange the code using the same redirect URI and resource and the original verifier. Keep the bearer token in the client; send it to `GET /agent/tenant` and `GET /agent/integration/schema` on that origin. An existing MCP host may instead use `/mcp` with the corresponding `ORIGIN/mcp` resource.
- **Web reading only.** Give the user the [developer console](https://opentally.linkex.ai/console/) and CLI steps for their development machine. Continue when an authorized execution environment is available. No model-provider account or plugin is required for the CLI or HTTP flow.

## Connect real billing data

1. The user signs in to OpenTally in the browser. New users can register with an email they can verify. Offer Google sign-in when `/developer/config` advertises `google_login: true`. Any model can guide this flow. Return to the consent tab, continue, and select a workspace or create the first one there. On callback the client can continue automatically. Start with read access for workspace/schema discovery. Request additional scopes for the operations the user chooses. Tokens last at most one hour, require the original session and current workspace membership, and must be reauthorized on expiry.
2. Discover fields through `get_integration_schema` (MCP) or `schema` (CLI). Inputs use the current service's shared types, not signed-section JSON. Never invent identity, price, or customer retail details. Generation 6 currently supports token only.
3. Preview confirmed contract pricing before publishing. Use `preview_pricing`/`pricing-preview`, then `publish_pricing`/`pricing-publish -apply` only within the user's authorization. Authoritative arithmetic is server-side and exact.
4. Preview a real outbox event as JSON text, preserving int64 and raw nested JSON. `preview_event` accepts `event_json`. CLI `plan -file event.json -output plan.json` persists a successful preflight, bound to the origin and tenant. Preflight does not write receipts or verify authenticity.
5. Deploy a deterministic exporter. CLI `credential-create -file label.json -output PRIVATE_FILE -apply` writes an ingest token without printing it; this requires the `credentials:create_ingest` scope. MCP deliberately does not return runtime secrets. Never send passwords, API keys, prompts, or personal data as usage payloads.
6. Queue the successful plan with `queue-add -file plan.json`; deliver using `queue-run -apply -credential-file PRIVATE_FILE` under a process supervisor. Every queue command takes `-server ORIGIN -tenant SLUG -queue DIRECTORY`. Keep the business outbox until local enqueue succeeds. Network failure can leave a partial or unknown result: replay identical bytes with stable source IDs. Never relabel synthetic traffic as live.
7. Query `get_event_status`/`status -id ID` using the decimal-text ID from ingest responses. Report queue, receipt, commitment, TSA and anchor states separately. Service observations are not cryptographic verification. Run the offline verifier separately; report PASS/FAIL/SKIPPED. Check 5 is TSA, chain verification is separate.

Local queue files contain private billing records and must remain outside source control and shared folders. Local snapshots are not a server backup. `accepted` means HTTP acknowledgement, not signed. `blocked` requires a deliberate retry after the cause is resolved. Logging out/revoking an agent token does not revoke an independently issued runtime ingest token.


For a service implementation, follow the [TypeScript and Python adapters](https://github.com/opentallyprotocol/connect/tree/main/integrations). A funded model call or a valid plan alone does not establish delivery. Record the tenant, stable source ID, ingest ID and receipt sequence, then verify the receipt bundle with the [offline verifier distribution](https://opentally.linkex.ai/verifier/index.json).

### CLI delivery after setup

Use files in a private directory. Obtain `setup.json` via a separate OAuth login with the scopes needed for the selected operations. Use `integration:read integration:preview` to preflight; add `pricing:publish` only when publishing agreed prices, and `credentials:create_ingest` to issue a runtime credential. Keep the issuer's source of truth for identity, rates and event IDs. The setup steps below assume the referenced expression is published and event.json contains the real record.

```sh
opentally-connect plan -server "$OT_SERVER" -auth setup.json -file event.json -output plan.json
# label.json contains {"label":"billing-exporter"}. Create this credential once.
opentally-connect credential-create -server "$OT_SERVER" -auth setup.json -file label.json -output ingest.json -apply
opentally-connect queue-add -server "$OT_SERVER" -tenant "$OT_TENANT" -queue queue -file plan.json
opentally-connect queue-flush -server "$OT_SERVER" -tenant "$OT_TENANT" -queue queue -credential-file ingest.json -apply
opentally-connect status -server "$OT_SERVER" -auth setup.json -id "$EVENT_ID"
```

Set OT_TENANT from doctor and EVENT_ID from the accepted delivery's ids. Inspect the returned status until issued and committed; use its bundle_url for that receipt. Anonymous bundles disclose hash evidence. Verify with the authorized supplier/customer sections and referenced pricing for the checks that require them.

OpenTally · [Original guide](https://opentally.linkex.ai/agent/guide.md) · [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Service links are absolute in this copy.
