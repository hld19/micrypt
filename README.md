![Micrypt logo](ok/ok.png)

# Micrypt
Available languages:
- [Dutch](readme.nl.md)

Micrypt is a desktop vault that protects files with strong encryption using Go and Wails.

## Encryption Overview

Micrypt derives master keys with argon2id using user passwords, optional PIM values, and optional keyfiles. File data is encrypted with aes256 gcm by default, with cascade options that layer serpent256 gcm and twofish256 gcm. Each file stores unique nonces and integrity tags so tampering is detected. Vault metadata and the recovery mnemonic are encrypted with aes256 gcm as well.

## Requirements

1. Go 1.24 or newer
2. Node 18 or newer
3. npm

## Setup

Run the frontend install steps once.

```sh
cd frontend
npm install
cd ..
cd micrypt
```

## Development

Start the desktop development session.

```sh
make dev
```

## Production build

Create a distributable build.

```sh
make build
```

## Tests

Run all Go test suites.

```sh
GOCACHE=$(pwd)/.gocache go test ./...
```

## Data Flow

1. The React interface triggers actions through the Wails runtime.
2. The Go backend applies vault logic to encrypt and decrypt data.
3. Encrypted files and metadata are written to the mvault container on disk.
