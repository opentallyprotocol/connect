"""Durable local delivery through the verified OpenTally CLI. No billing arithmetic."""
import os
import subprocess
import tempfile
from pathlib import Path


class OpenTallyQueue:
    def __init__(self, *, server, tenant, directory, executable="opentally-connect", credential_file=None):
        self.server = server
        self.tenant = tenant
        self.directory = os.fspath(directory)
        self.executable = os.fspath(executable)
        self.credential_file = credential_file

    def _invoke(self, command, *args):
        argv = [self.executable, command, "-server", self.server, "-tenant", self.tenant, "-queue", self.directory]
        if self.credential_file:
            argv += ["-credential-file", os.fspath(self.credential_file)]
        result = subprocess.run(argv + list(args), capture_output=True, text=True, check=False, timeout=120)
        if result.returncode not in (0, 3):
            raise RuntimeError("OpenTally operation failed; inspect private queue status")
        # Preserve raw JSON, including IDs above JavaScript's safe integer range.
        return {"exit_code": result.returncode, "json_text": result.stdout}

    def enqueue_batch(self, batch_json):
        """Call after the real billing outbox commits. Reuse exact bytes on retries."""
        with tempfile.TemporaryDirectory(prefix="opentally-") as folder:
            file = Path(folder) / "batch.json"
            fd = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as output:
                output.write(batch_json)
            return self._invoke("queue-add", "-file", str(file))

    def flush(self):
        return self._invoke("queue-flush", "-apply")

    def status(self):
        return self._invoke("queue-status")
