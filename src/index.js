import 'babel-polyfill';
import { exec } from 'child_process';
import { BaseTask } from 'clow';

function pExec(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve({ command, stdout, stderr });
    });
  });
}

export default class NpmInstallTask extends BaseTask {
  constructor(generatorDir, destDir) {
    super();

    this.name = 'npm-install';
    this.destDir = destDir;
  }

  run(task) {
    return new Promise((resolve, reject) => {
      const { dependencies = [], devDependencies = [] } = task;

      const depPromise = () => dependencies
        .map(name => () => {
          this.log(`install ${name}`);
          return pExec(`npm install -SE ${name}`, { cwd: this.destDir })
            .then(result => this.log(result.stdout));
        })
        .reduce((p, f) => p.then(f), Promise.resolve());
      const devPromise = () => devDependencies
        .map(name => () => {
          this.log(`install ${name}`);
          return pExec(`npm install -DE ${name}`, { cwd: this.destDir })
            .then(result => this.log(result.stdout));
        })
        .reduce((p, f) => p.then(f), Promise.resolve());

      Promise.resolve()
        .then(depPromise)
        .then(devPromise)
        .then(resolve)
        .catch(reject);
    });
  }
}
