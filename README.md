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
  force: true
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

### `party.setup(options)`

Configure hostparty. Returns the party instance for chaining.

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Custom path to hosts file |
| `force` | `boolean` | Bypass protection on system entries |

```javascript
party.setup({ path: '/custom/hosts', force: true }).removeIP('::1');
```

---

## CLI Reference

```
Usage: hostparty [options] [command]

Commands:
  list [options] [hostname]          Output hosts file, optionally filtered
  add [options] [ip] [hosts...]      Add hostname(s) to an IP address
  remove-ip [options] [ips...]       Remove all entries for IP address(es)
  remove-host [options] [hosts...]   Remove specific hostname(s)

Options:
  -p, --path      Path to hosts file (auto-detected by default)
  -f, --force     Bypass validation on protected entries
  -ng, --no-group Don't group output by IP
  -h, --help      Show help
  -V, --version   Show version
```

### Examples

```bash
# Add hosts
hostparty add 127.0.0.1 myapp.local api.local

# List all entries
hostparty list

# List entries matching a hostname
hostparty list myapp

# Remove all entries for an IP
hostparty remove-ip 127.0.0.1

# Remove specific hostnames
hostparty remove-host old-site.local
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

Use the `--force` flag (CLI) or `force: true` option (API) to remove protected entries:

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
