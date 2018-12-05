const { Command, flags } = require('@oclif/command');
const stringify = require('safe-json-stringify');
const { spawn } = require('child_process');
const debug = require('debug')('rn-link');
const chokidar = require('chokidar');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');

/**
 * Try to require a file but ignore the error if it does not exist.
 *
 * @param {String} path Path to requirable file.
 * @private
 */
function tryRequire(path) {
  try {
    return require(path);
  } catch (e) {
    // ignore the error.
  }
}

//
// List of files and folders to exclude by default.
//
const ignored = [
  `**${ path.sep }node_modules`,
  `*${ path.sep }build`,
  `.*`
];

/**
 * Orchestrate watching and syncing of files from source.
 *
 * @param {String} source Absolute path to source
 * @private
 */
function foreman(source) {
  const target = path.join(process.cwd(), 'node_modules', require(path.join(source, 'package.json')).name);
  const watcher = chokidar.watch(source, {
    ignored
  });


  /**
   * On any change or event execute rsync once.
   * @private
   */
  function setup() {
    watcher.once('all', execute);
  }

  /**
   * Predefined setup of rsync between source and target.
   *
   * @private
   */
  function execute() {
    const excludes = ignored.map(ignore => `--exclude="${ ignore }"`);
    console.log('!!! would have synced:', JSON.stringify(['-av', '--progress', ...excludes, source,  target ]));
    // const child = spawn('rsync', 
    //   ['-av', '--progress', ...excludes, source,  target ], {
    //     stdio: ['inherit', 'inherit', 'inherit']
    //   });

    // child.on('close', function (code) {
    //   if (code !== 0) {
    //     process.stderr.write(`rsync exited with ${ code }`);
    //     process.exit(code);
    //   }

    //   setup();
    // });

    // child.on('error', function (error) {
    //   throw error;
    // });
  }

  //
  // Manually remove downstream files from the target, `rsync` only performs write operations.
  //
  watcher.on('unlink', function remove(file) {
    fs.unlink(path.resolve(target, file.replace(source, '')), function removed(error) {
      if (error) debug(`Error removing file: ${ error.message }`);
    });
  });

  //
  // Ensure all required target directories exist, `rsync` cannot handle creating multiple directories.
  //
  mkdirp(target, function created(error) {
    if (error) throw error;

    //
    // Initialize
    //
    debug(`Watching source: ${ source }`);
    debug(`Syncing to target: ${ target }`);
    setup();
  });
}

class ReactNativeYunolinkCommand extends Command {
  async run() {
    const { argv, flags } = this.parse(ReactNativeYunolinkCommand);
    const sources = argv.map(ref => path.join(path.resolve(ref), path.sep));
    const metroConfig = path.join(process.cwd(), 'metro.config.json');
    const config = tryRequire(metroConfig) || {};

    //
    // Add ignore folders to defaults.
    //
    ignored.push(...flags.ignore);

    //
    // Update watchFolders in the configuration to include all sources.
    //
    fs.writeFileSync(metroConfig, stringify({
      ...config,
      watchFolders: Array.from(new Set([ ...(config.watchFolders || []), ...sources ]))
    }, null, 2));

    //
    // Restore the original Metro bundler configuration on exit.
    //
    process.once('SIGINT', function restore() {
      debug('Restoring configuration', config);

      fs.writeFileSync(metroConfig, stringify(config, null, 2));
      process.exit();
    });

    //
    // For each whitespace delimited path setup a forman to watch and sync all the files.
    //
    sources.map(foreman);
  }
}

//
// Disable argument parsing
//
ReactNativeYunolinkCommand.strict = false;
ReactNativeYunolinkCommand.args = [{
  name: '...targets',
  required: true,
  description: 'One or multiple repositories to watch and sync'
}];

ReactNativeYunolinkCommand.flags = {
  version: flags.version({ char: 'v' }),
  ignore: flags.string({
    char: 'i',
    description: 'comma separated list of files and folders to ignore',
    parse: input => input.split(','),
    default: []
  })
};

ReactNativeYunolinkCommand.description = 'Sync Node.JS modules to get around Metro Bundler\'s inability to use symlinks.'

module.exports = ReactNativeYunolinkCommand;
