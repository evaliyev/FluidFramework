/*!
 * Copyright (c) Autodesk, Inc. All rights reserved.
 * Licensed under the MIT License.
 */
/* globals targets */
const yargs = require('yargs');
const _ = require('lodash');
const { HFDM, PropertyFactory } = require('@hfdm/sdk');
const fs = require('fs');
const path = require('path');

global.targets = {
  csServerUrl_v1: 'http://127.0.0.1:3010',
  psServerUrl_v1: 'http://127.0.0.1:3000'
};

const processArgs = () => {
  const argv = yargs.option('token', {
    alias: 't',
    description: 'Authentication token (if needed)',
    type: 'string'
  })
  .option('apiUrl', {
    alias: 'a',
    description: 'API URL (if omitted, a local stack is assumed)',
    type: 'string'
  })
  .option('power', {
    alias: 'p',
    'default': 3,
    description: 'Order of magnitude of the amount of commits to import',
    type: 'number'
  })
  .option('folder', {
    alias: 'f',
    'default': 'commits',
    description: 'Path to a folder that contains the commits to ingest',
    type: 'string'
  }).argv;

  return Promise.resolve(argv);
};

const doWork = async (a) => {
  const hfdm = new HFDM();
  let connectOptions;
  if (a.apiUrl) {
    connectOptions = {
      serverUrl: a.apiUrl,
      getBearerToken: (cb) => cb(null, a.token)
    };
  } else {
    connectOptions = {
      serverUrl: targets.csServerUrl_v1,
      _pssUrl: targets.psServerUrl_v1
    };
  }
  await hfdm.connect(connectOptions);

  const workspace = hfdm.createWorkspace();
  await workspace.initialize({
    metadata: {
      materializedHistory: {
        enabled: true
      }
    }
  });

  const createdBranchUrn = workspace.getActiveBranch().getUrn();
  console.log(`Created branch ${createdBranchUrn}`);

  let commit;
  let commitFilePath, fileExists;
  let i = 1;
  do {
    commitFilePath = path.join(a.folder, `${i.toString().padStart(a.power, '0')}.json`);
    fileExists = fs.existsSync(commitFilePath);
    if (fileExists) {
      commit = JSON.parse(fs.readFileSync(commitFilePath));
      _.each(commit.changeSet.insertTemplates, (template) => {
        PropertyFactory.register(template);
      });
      workspace.getRoot().applyChangeSet(commit.changeSet);
      await workspace.commit();
      i++;
    }
  } while (fileExists);
};

processArgs().then((a) => doWork(a));
