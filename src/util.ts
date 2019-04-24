'use strict';

// Dependencies
import { spawn } from 'child_process';
import { basename, dirname, extname, join } from 'path';
import { workspace, window, Uri } from 'vscode';
const fs = require('fs');

const getConfig = () => {
  return workspace.getConfiguration('applescript');
};

const getOutName = (fileName, extension = 'scpt') => {
  let dirName  = dirname(fileName);
  let baseName = basename(fileName, extname(fileName));
  let outName  = join(dirName, `${baseName}.${extension}`);

  return outName;
};

const getDecompiledName = (fileName, extension = 'applescript') => {
  let dirName  = dirname(fileName);
  let baseName = basename(fileName);
  let outName  = join(dirName, `${baseName}.${extension}`);

  return outName;
};

const spawnPromise = (cmd: any, args: Array<string>, outputChannel) => {
  return new Promise((resolve, reject) => {
    // outputChannel.clear();
    if (getConfig().alwaysShowOutput === true) {
      outputChannel.show();
    }

    const process = spawn(cmd, args);

    let stdErr: string = '';

    process.stdout.on('data', (data) => {
      outputChannel.appendLine(data.toString());
    });

    process.stderr.on('data', (data) => {
      stdErr += '\n' + data;
      outputChannel.appendLine(data.toString());
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(stdErr);
        return reject();
      }

      return resolve();
    });
  });
};

const spawnSidecarFile = (cmd: any, args: Array<string>, outputPath, outputChannel) => {
  return new Promise((resolve, reject) => {
    outputChannel.clear();
    if (getConfig().alwaysShowOutput === true) {
      outputChannel.show();
    }

    const process = spawn(cmd, args);

    let stdErr: string = '';

    const outputFile = fs.createWriteStream( outputPath );

    // let outputStrings = [];

    process.stdout.on('data', (data) => {
      outputFile.write(data.toString())
      .catch( (err) => {
        outputChannel.append(err);
        outputChannel.show();
      });
    });

    process.stderr.on('data', (data) => {
      stdErr += '\n' + data;
      outputChannel.appendLine(data.toString());
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(stdErr);
        return reject();
      }


      outputFile.end();
      let openPath = Uri.file(outputPath);
      workspace.openTextDocument(openPath)
      .then( doc => {
        window.showTextDocument(doc);
      });

      return resolve();
    });
  });
};

export {
  getConfig,
  getOutName,
  getDecompiledName,
  spawnPromise,
  spawnSidecarFile
};
