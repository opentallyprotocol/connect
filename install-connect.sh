#!/usr/bin/env bash
# SPDX-License-Identifier: CC0-1.0
# Install a downloaded release candidate only after checking a separately obtained digest.
set -euo pipefail
artifact="${1:?usage: install-connect.sh ARTIFACT EXPECTED_SHA256 DESTINATION}"
expected="${2:?expected trusted SHA256 required}"
destination="${3:?explicit executable destination required}"
if [[ ! "$expected" =~ ^[0-9a-f]{64}$ ]]; then echo 'invalid SHA256' >&2; exit 1; fi
actual=$(shasum -a 256 "$artifact" | cut -d ' ' -f 1)
if [ "$actual" != "$expected" ]; then echo 'checksum mismatch' >&2; exit 1; fi
if [ -e "$destination" ] || [ -L "$destination" ]; then echo 'destination already exists' >&2; exit 1; fi
# Do not execute the downloaded artifact during installation.
(umask 077; set -C; cat "$artifact" > "$destination")
chmod 700 "$destination"
