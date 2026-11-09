import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Local durable delivery adapter. No pricing logic; no model in the delivery loop. */
export class OpenTallyQueue {
  constructor(private readonly options: {
    server: string; tenant: string; directory: string; executable?: string; credentialFile?: string;
  }) {}

  private invoke(command: string, args: string[] = []): Promise<{ exitCode: number; jsonText: string }> {
    const common = ['-server', this.options.server, '-tenant', this.options.tenant, '-queue', this.options.directory];
    if (this.options.credentialFile) common.push('-credential-file', this.options.credentialFile);
    return new Promise((resolve, reject) => {
      const child = spawn(this.options.executable ?? 'opentally-connect', [command, ...common, ...args], { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      let size = 0; const chunks: Buffer[] = [];
      child.stdout.on('data', (chunk: Buffer) => { size += chunk.length; if (size > 4 * 1024 * 1024) { child.kill(); reject(new Error('OpenTally output limit exceeded')); } else chunks.push(chunk); });
      child.stderr.resume(); // Never include process diagnostics or credentials in exceptions.
      child.on('error', () => reject(new Error('OpenTally executable unavailable')));
      child.on('close', code => {
        if (code !== 0 && code !== 3) { reject(new Error('OpenTally operation failed; inspect private queue status')); return; }
        resolve({ exitCode: code, jsonText: Buffer.concat(chunks).toString('utf8') });
      });
    });
  }

  /** Call after committing the billing event to your business outbox. Reuse exact bytes on retry. */
  async enqueueBatch(batchJSON: string) {
    const dir = await mkdtemp(join(tmpdir(), 'opentally-'));
    try {
      const file = join(dir, 'batch.json');
      await writeFile(file, batchJSON, { mode: 0o600, flag: 'wx' });
      return await this.invoke('queue-add', ['-file', file]);
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
  flush() { return this.invoke('queue-flush', ['-apply']); }
  status() { return this.invoke('queue-status'); }
}
