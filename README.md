# hostparty

[![npm version](https://img.shields.io/npm/v/hostparty.svg)](https://www.npmjs.com/package/hostparty)

Cross-platform CLI and JavaScript API for managing your hosts file.

## Installation

```bash
# CLI usage
npm install -g hostparty

# Library usage
npm install hostparty
```

## Quick Start

### As a Library

```javascript
import party from 'hostparty';

// Add hosts to an IP
await party.add('127.0.0.1', ['myapp.local', 'api.local']);

// List all host entries
const hosts = await party.list();
// { '127.0.0.1': ['myapp.local', 'api.local'] }

// Remove specific hostnames
await party.removeHost('api.local');

// Remove all entries for an IP
await party.removeIP('127.0.0.1');
```

### Configuration

```javascript
import party from 'hostparty';

// Custom hosts file path and force mode
party.setup({
  path: '~/my-own/hosts',
  force: true,
  dryRun: false,      // Preview changes without writing
  autoBackup: true,   // Auto-backup before changes
  maxBackups: 10      // Max backups to keep
});

await party.removeIP('::1');  // Normally protected, but force allows it
```

### CommonJS

```javascript
const party = require('hostparty');

await party.add('127.0.0.1', ['example.local']);
```

---

## API Reference

All methods return Promises.

### `party.add(ip, hosts)`

Add hostname(s) to an IP address.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ip` | `string` | IP address to map to |
| `hosts` | `string \| string[]` | Hostname(s) to add |

```javascript
await party.add('127.0.0.1', ['site.local', 'api.local']);
```

### `party.list([hostname])`

List all entries, optionally filtered by hostname.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hostname` | `string` | Optional hostname to filter by |

```javascript
const all = await party.list();
const filtered = await party.list('myapp.local');
```

### `party.removeIP(ips)`

Remove all entries for the specified IP address(es).

| Parameter | Type | Description |
|-----------|------|-------------|
| `ips` | `string \| string[]` | IP address(es) to remove |

```javascript
await party.removeIP(['127.0.0.1', '8.8.4.4']);
```

### `party.removeHost(hosts)`

Remove specific hostname(s) from any IP.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hosts` | `string \| string[]` | Hostname(s) to remove |

```javascript
await party.removeHost('old-site.local');
```

### `party.renameHost(oldHostName, newHostName)`

Rename a hostname while keeping its IP binding.

| Parameter | Type | Description |
|-----------|------|-------------|
| `oldHostName` | `string` | Current hostname |
| `newHostName` | `string` | New hostname |

```javascript
await party.renameHost('old-app.local', 'new-app.local');
```

### `party.moveHostname(hostname, toIP)`

Move a hostname from its current IP to a new IP.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hostname` | `string` | Hostname to move |
| `toIP` | `string` | Destination IP address |

```javascript
await party.moveHostname('myapp.local', '192.168.1.100');
```

### `party.replaceIP(fromIP, toIP, [keepSource])`

Migrate all hostnames from one IP to another.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fromIP` | `string` | Source IP address |
| `toIP` | `string` | Destination IP address |
| `keepSource` | `boolean` | Keep source IP (copy mode). Default: `false` |

```javascript
// Move all hostnames (removes source IP)
await party.replaceIP('192.168.1.1', '192.168.1.2');

// Copy all hostnames (keeps source IP)
await party.replaceIP('192.168.1.1', '192.168.1.2', true);
```

### `party.searchByIP(ip)`

Find all hostnames mapped to a given IP address.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ip` | `string` | IP address to search for |

Returns `{ ip, hostnames }` or `null` if not found.

```javascript
const result = await party.searchByIP('127.0.0.1');
// { ip: '127.0.0.1', hostnames: ['localhost', 'myapp.local'] }
```

### `party.disable(ips)`

Disable IP entries by commenting them out.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ips` | `string \| string[]` | IP address(es) to disable |

```javascript
await party.disable('192.168.1.100');
// Entry becomes: # 192.168.1.100 myapp.local
```

### `party.enable(ips)`

Re-enable previously disabled IP entries.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ips` | `string \| string[]` | IP address(es) to enable |

```javascript
await party.enable('192.168.1.100');
// Restores: 192.168.1.100 myapp.local
```

### `party.getStats()`

Get statistics about the hosts file.

```javascript
const stats = await party.getStats();
// {
//   activeIPs: 12,
//   disabledIPs: 2,
//   totalIPs: 14,
//   totalHostnames: 28,
//   uniqueHostnames: 25
// }
```

### `party.createBackup()`

Create a backup of the current hosts file.

```javascript
const backupPath = await party.createBackup();
// ~/.hostparty-backups/hosts.backup.2024-01-15T10-30-00-000Z
```

### `party.listBackups()`

List all available backup files.

```javascript
const backups = await party.listBackups();
// [{ filename, path, timestamp }, ...]
```

### `party.restore([backupPath])`

Restore the hosts file from a backup.

| Parameter | Type | Description |
|-----------|------|-------------|
| `backupPath` | `string` | Path to backup file. Default: latest backup |

```javascript
// Restore from latest backup
await party.restore();

// Restore from specific backup
await party.restore('/path/to/backup');
```

### `party.setup(options)`

Configure hostparty. Returns the party instance for chaining.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | auto | Custom path to hosts file |
| `force` | `boolean` | `false` | Bypass protection on system entries |
| `dryRun` | `boolean` | `false` | Preview changes without writing |
| `autoBackup` | `boolean` | `true` | Auto-backup before changes |
| `maxBackups` | `number` | `10` | Maximum backups to retain |

```javascript
party.setup({ path: '/custom/hosts', force: true }).removeIP('::1');
```

---

## CLI Reference

```
Usage: hostparty [options] [command]

Commands:
  list [hostname]                    Output hosts file, optionally filtered
  add [ip] [hosts...]                Add hostname(s) to an IP address
  remove-ip [ips...]                 Remove all entries for IP address(es)
  remove-host [hosts...]             Remove specific hostname(s)
  rename-host [oldHost] [newHost]    Rename a hostname
  move-hostname [hostname] [toIP]    Move a hostname to a different IP
  search-ip [ip]                     Find all hostnames for an IP
  replace-ip [fromIP] [toIP]         Migrate hostnames between IPs
  disable [ips...]                   Comment out IP entries
  enable [ips...]                    Restore commented IP entries
  stats                              Show hosts file statistics
  backup                             Create a backup
  list-backups                       List available backups
  restore [filename]                 Restore from backup

Options:
  --path [path]     Path to hosts file (auto-detected by default)
  --force           Bypass validation on protected entries
  --no-group        Don't group output by IP
  --dry-run         Preview changes without applying
  --no-backup       Skip automatic backup
  --json            Output in JSON format (list, stats)
  --csv             Output in CSV format (list)
  --keep-source     Keep source IP when using replace-ip
  -h, --help        Show help
  -V, --version     Show version
```

### Examples

```bash
# Add hosts
hostparty add 127.0.0.1 myapp.local api.local

# List all entries
hostparty list

# List entries matching a hostname
hostparty list myapp

# List in JSON format
hostparty list --json

# List in CSV format
hostparty list --csv

# Remove all entries for an IP
hostparty remove-ip 127.0.0.1

# Remove specific hostnames
hostparty remove-host old-site.local

# Rename a hostname
hostparty rename-host old.local new.local

# Move a hostname to a different IP
hostparty move-hostname myapp.local 192.168.1.100

# Find hostnames for an IP
hostparty search-ip 127.0.0.1

# Migrate all hostnames from one IP to another
hostparty replace-ip 192.168.1.1 192.168.1.2

# Copy hostnames (keep source)
hostparty replace-ip 192.168.1.1 192.168.1.2 --keep-source

# Temporarily disable an IP entry
hostparty disable 192.168.1.100

# Re-enable a disabled entry
hostparty enable 192.168.1.100

# Preview changes without applying
hostparty add 127.0.0.1 test.local --dry-run

# Show statistics
hostparty stats

# Create a backup
hostparty backup

# List available backups
hostparty list-backups

# Restore from latest backup
hostparty restore

# Restore from specific backup
hostparty restore hosts.backup.2024-01-15T10-30-00-000Z

# Skip auto-backup for a change
hostparty add 127.0.0.1 temp.local --no-backup
```

### Smart Argument Detection

If you accidentally swap arguments, hostparty detects and offers to correct:

```bash
$ hostparty add example.com 192.168.1.100

Warning: Arguments might be swapped. Did you mean: 192.168.1.100 example.com?
Use the suggested order? (y/n): y
Using corrected order.
1 hostname(s) added to IP 192.168.1.100
```

---

## Backup & Restore

Hostparty automatically creates backups before making changes. Backups are stored in `~/.hostparty-backups/`.

```bash
# Manual backup
hostparty backup

# List backups
hostparty list-backups
# Found 3 backup(s):
#   hosts.backup.2024-01-15T10-30-00-000Z
#   hosts.backup.2024-01-14T15-45-00-000Z
#   hosts.backup.2024-01-13T09-00-00-000Z

# Restore latest
hostparty restore

# Restore specific backup
hostparty restore hosts.backup.2024-01-14T15-45-00-000Z

# Skip auto-backup for a single operation
hostparty remove-host temp.local --no-backup
```

### Backup Configuration

```javascript
party.setup({
  autoBackup: true,   // Enable/disable auto-backup (default: true)
  maxBackups: 10      // Maximum backups to keep (default: 10)
});
```

---

## Dry Run Mode

Preview changes before applying them:

```bash
$ hostparty add 127.0.0.1 test.local --dry-run
[DRY RUN] Would add: test.local -> 127.0.0.1
[DRY RUN] No changes written to disk.
```

```javascript
party.setup({ dryRun: true });
const result = await party.add('127.0.0.1', ['test.local']);
// { dryRun: true, message: 'Would add: test.local -> 127.0.0.1', preview: '...' }
```

---

## Protected Entries

Certain entries are protected from accidental removal as they're critical for OS networking. Attempting to remove these without the `force` flag will result in an error.

### Protected IP Addresses

| IP | Purpose | OS |
|----|---------|-----|
| `127.0.0.1` | IPv4 loopback | All |
| `::1` | IPv6 loopback | All |
| `fe80::1%lo0` | Link-local address | macOS |
| `255.255.255.255` | Broadcast address | macOS |

### Protected Hostnames

| Hostname | Purpose | OS |
|----------|---------|-----|
| `localhost` | Loopback hostname | All |
| `broadcasthost` | Broadcast hostname | macOS |

### Overriding Protection

Use the `--force` flag (CLI) or `force: true` option (API) to modify protected entries:

```bash
# CLI
hostparty remove-ip 127.0.0.1 --force
hostparty remove-host localhost --force
```

```javascript
// API
party.setup({ force: true }).removeIP('127.0.0.1');
party.setup({ force: true }).removeHost('localhost');
```

**Warning:** Removing these entries can break networking on your system. Use with caution.

## License

MIT
