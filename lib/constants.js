/**
 * constants used throughout the hostparty application
 */

module.exports = {
    // protected entries that cannot be easily removed
    PROTECTED_ENTRIES: {
        IPS: [
            '127.0.0.1',           // IPv4 loopback (all systems)
            '::1',                 // IPv6 loopback (all systems)
            'fe80::1%lo0',         // link-local (macOS)
            '255.255.255.255'      // broadcast (macOS)
        ],
        HOSTS: [
            'localhost',
            'broadcasthost'
        ]
    },

    // operating system platforms
    PLATFORMS: {
        LINUX: 'linux',
        DARWIN: 'darwin',
        FREEBSD: 'freebsd',
        OPENBSD: 'openbsd',
        WIN32: 'win32'
    },

    // file system paths
    PATHS: {
        UNIX_HOSTS: '/etc/hosts',
        WINDOWS_HOSTS_SUFFIX: '\\System32\\drivers\\etc\\hosts',
        BACKUP_DIR: '.hostparty-backups'
    },

    // error codes
    ERROR_CODES: {
        ACCESS_DENIED: 'EACCES'
    },

    // user roles for elevated access
    USER_ROLES: {
        WINDOWS_ADMIN: 'Administrator',
        UNIX_ROOT: 'root'
    },

    // user input responses
    USER_RESPONSES: {
        YES_SHORT: 'y',
        YES_LONG: 'yes',
        NO_SHORT: 'n',
        NO_LONG: 'no'
    },

    // messages and prompts
    MESSAGES: {
        ARGUMENT_SWAP_PROMPT: 'Use the suggested order? (y/n): ',
        ARGUMENT_SWAP_WARNING: 'Warning: Arguments might be swapped.',
        ORDER_CORRECTED: 'Using corrected order.',
        SWAP_SUGGESTION_FORMAT: 'Did you mean: %s %s?',
        DRY_RUN_PREFIX: '[DRY RUN]',
        DRY_RUN_NO_CHANGES: '[DRY RUN] No changes written to disk.',
        BACKUP_CREATED: 'Backup created: %s',
        BACKUP_RESTORED: 'Restored from backup: %s',
        NO_BACKUPS_FOUND: 'No backups found.',
        BACKUP_PRUNED: 'Pruned %d old backup(s).'
    },

    // regex patterns
    REGEX: {
        WINDOWS_PLATFORM: /^win/i,
        COMMENT_LINE: /^\#/,
        WHITESPACE_NORMALIZE: /(\s)+/g,
        HOSTNAME_VALIDATION: /^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]))$/
    },

    // default options
    DEFAULT_OPTIONS: {
        GROUP_HOSTS: true,
        FORCE_CHANGES: false,
        DRY_RUN: false,
        AUTO_BACKUP: true,
        MAX_BACKUPS: 10
    },

    // output formatting
    OUTPUT: {
        TABLE_SEPARATOR: ' | ',
        NEWLINE: '\n',
        SPACE: ' '
    }
};