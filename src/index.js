const { Command, flags } = require('@oclif/command');
const { exec } = require('child_process');
const debug = require('debug')('rn-link');
const chokidar = require('chokidar');
const path = require('path');

class ReactNativeYunolinkCommand extends Command {
  async run() {
    const { args } = this.parse(ReactNativeYunolinkCommand);
    const source = path.join(path.resolve(args.target), path.sep);
    const target = path.join(process.cwd(), 'node_modules', require(path.join(source, 'package.json')).name);
    const watcher = chokidar.watch(source, {
      ignored: [
        `**${ path.sep }node_modules${ path.sep }**`,
        /(^|[\/\\])\../
      ]
    });


    /**
     * On any change or event execute rsync once.
     *
     * @param {Error} error Error from `exec`.
     * @param {String} stdout Output from stdout.
     * @param {String} stderr Output from stderr.
     * @private
     */
    function setup(error, stdout, stderr) {
      if (error) throw error;
      if (stdout && stdout.length) process.stdout.write(stdout);
      if (stderr && stderr.length) process.stderr.write(stderr);

      watcher.once('all', execute);
    }

    /**
     * Predefined setup of rsync between source and target.
     *
     * @private
     */
    function execute() {
      exec(`rsync -av --progress --exclude=node_modules --exclude=.git ${ source } ${ target }`, setup);
    }

    //
    // Initialize once.
    //
    debug(`Watching source: ${ source }`);
    debug(`Syncing to target: ${ target }`);
    setup();
  }
}

ReactNativeYunolinkCommand.args = [{
  name: 'target',
  required: true,
  description: 'repository to link'
}];

ReactNativeYunolinkCommand.description = 'Sync Node.JS modules to get around Metro Bundler\'s inability to use symlinks.'

module.exports = ReactNativeYunolinkCommand;
