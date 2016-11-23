/**
 * [fileMaps description]
 *
 * @type {Object}
 *
 *
Operating System	Version(s)	Location
Unix, Unix-like, POSIX		/etc/hosts[3]
Microsoft Windows	3.1	%WinDir%\HOSTS
95, 98, ME	%WinDir%\hosts[4]
NT, 2000, XP,[5] 2003, Vista,
2008, 7, 2012, 8, 10	%SystemRoot%\System32\drivers\etc\hosts [6]
Windows Mobile, Windows Phone		Registry key under HKEY_LOCAL_MACHINE\Comm\Tcpip\Hosts
Apple Macintosh	9 and earlier	Preferences or System folder
Mac OS X 10.0–10.1.5[7]	(Added through NetInfo or niload)
Mac OS X 10.2 and newer	/etc/hosts (a symbolic link to /private/etc/hosts)[7]


path = auto detect or, --path=/etc/hosts-test
repository, allow diffs
show history
validate dupes
order by hosts

hostparty add 10.44.55.66 foo.net balls test - add new row (or add entries to existing)
hostparty remove 10.44.55.66 - remove ip
hostparty purge foo.net - remove host<s>
hostparty list <hostname> - list file, or matching entries
hostparty hosts - lists all hosts
 */
(function () {

    var pkg         = require('./package.json'),
        program     = require('commander'),
        promise     = require('bluebird'),
        isCLI       = !module.parent;

    if (isCLI) {

        var cmdValue, cmdParams;

        // program
        //     .version(pkg.version)
        //     .arguments('<cmd> [params...]')
        //     .option('--path <path>', 'Path to file if not using auto discovery.')
        //     .option('--test <test>', 'Outputs the resultant file to stdout without writing it.')
        //     .action(function (cmd, params) {
        //         cmdValue = cmd;
        //         cmdParams = params;
        //  });

        // program.parse(process.argv);
        //
        // program
        //   .command('foo <ip> [hosts...]')
        //   .option('-p, --path', 'enable some path')
        //   .description('execute the given remote cmd')
        //   .action(function (ip, hosts) {
        //     console.log('foo in action: ip: %s. hosts: %s', ip, hosts);
        //   });

        program
            .command('setup [env...]')
            .description('run setup commands for all envs')
            .option("-s, --setup_mode [mode]", "Which setup mode to use")
            .option("-t, --test [test]", "Which test value to use")
            .action(function(env, options){
                var mode = options.setup_mode || "normal";
                env = env || 'all';
                console.log('setup for %s env(s) with %s mode', env, mode);
            });

        program.parse(process.argv);

        // console.log('command:', cmdValue);
        // console.log('cmdParams: ', cmdParams || "no environment given");
        // console.log('options: ', program.path, program.test);
    } else {
        module.exports = party;
    }




    // var windir = process.env.windir || process.env.WINDIR;
    //   if (typeof windir === 'string' && windir.length > 0) {
    //     file = windir + '\\SysWOW64\\cmd.exe';
    //   }

    // fs  .readFileAsync('/etc/hosts')
    //     .then(function(file) {
    //
    //         var hosts = {};
    //
    //         file.toString().split("\n").map(function(line) {
    //
    //             if (line.indexOf('#') === 0) {
    //                 return;
    //             }
    //
    //             line = line .replace(/(\s)+/g, ' ')
    //                         .split(' ');
    //
    //             console.log("ip % hostname %s", line[0], line[1], line);
    //         });
    //     });

    // console.log(os.arch(), fileMaps.test);
})();
