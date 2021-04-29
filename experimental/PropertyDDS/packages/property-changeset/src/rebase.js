const ChangeSet = require('./changeset');
const _ = require('lodash');

const SyncPromise = x => ({
  value: x,
  then(fn) {
    this.value = fn(this.value);
    return this;
  }
})

function rebaseToRemoteChanges(change, getUnrebasedChange, getRebasedChanges, isAsync = false) {
  const makePromise = isAsync ? Promise.resolve : SyncPromise;
  const commitsOnOtherLocalBranch = {};
  let rebaseBaseChangeSet = new ChangeSet({});
  const changesOnOtherLocalBranch = [];
  if (change.referenceGuid !== change.remoteHeadGuid) {
    // Extract all changes between the remoteHeadGuid and the referenceGuid
    let currentGuid = change.referenceGuid;
    for (; ;) {
      const currentChange = getUnrebasedChange(currentGuid);
      if (currentChange === undefined) {
        throw new Error("Received change that references a non-existing parent change");
      }
      changesOnOtherLocalBranch.unshift(currentChange);
      commitsOnOtherLocalBranch[currentGuid] = currentChange;
      if (currentGuid === change.localBranchStart) {
        break;
      }
      currentGuid = currentChange.referenceGuid;
    }

    // Now we extract all changes until we arrive at a change that is relative to a remote change
    const alreadyRebasedChanges = [];
    let currentRebasedChange = getUnrebasedChange(change.localBranchStart);
    while (currentRebasedChange.remoteHeadGuid !== currentRebasedChange.referenceGuid) {
      currentGuid = currentRebasedChange.referenceGuid;
      currentRebasedChange = getUnrebasedChange(currentGuid);
      alreadyRebasedChanges.unshift(currentRebasedChange);
      if (currentRebasedChange === undefined) {
        throw new Error("Received change that references a non-existing parent change");
      }
    }

    // Compute the base Changeset to rebase the changes on the branch that was still the local branch
    // when the incoming change was created

    // First invert all changes on the previous local branch
    const startGuid = alreadyRebasedChanges.length > 0 ?
      alreadyRebasedChanges[0].referenceGuid :
      changesOnOtherLocalBranch[0].referenceGuid;

    // Then apply all changes on the local remote branch
    const endGuid = change.remoteHeadGuid;
    const relevantRemoteChanges = getRebasedChanges(startGuid, endGuid);
    let rebaseBaseChangeSetForAlreadyRebasedChanges = new ChangeSet({});

    for (const c of relevantRemoteChanges) {
      let changeset = c.changeSet;
      let applyAfterMetaInformation;

      if (alreadyRebasedChanges[0] !== undefined && alreadyRebasedChanges[0].guid === c.guid) {
        const invertedChange = new ChangeSet(_.cloneDeep(alreadyRebasedChanges[0].changeSet));
        invertedChange._toInverseChangeSet();
        invertedChange.applyChangeSet(rebaseBaseChangeSetForAlreadyRebasedChanges);
        applyAfterMetaInformation = new Map();
        const conflicts2 = [];
        changeset = _.cloneDeep(alreadyRebasedChanges[0].changeSet);
        rebaseBaseChangeSetForAlreadyRebasedChanges._rebaseChangeSet(changeset, conflicts2, {
          applyAfterMetaInformation,
        });

        rebaseBaseChangeSetForAlreadyRebasedChanges = invertedChange;
        alreadyRebasedChanges.shift();
      }
      rebaseBaseChangeSetForAlreadyRebasedChanges.applyChangeSet(changeset, { applyAfterMetaInformation });
    }

    // Now we have to rebase all changes from the remote local branch with respect to this base changeset
    rebaseChangeArrays(rebaseBaseChangeSetForAlreadyRebasedChanges, changesOnOtherLocalBranch);

    // Update the reference for the rebased changes to indicate that they are now with respect to the
    // new remoteHeadGuid
    if (changesOnOtherLocalBranch.length > 0) {
      changesOnOtherLocalBranch[0].remoteHeadGuid = change.remoteHeadGuid;
      changesOnOtherLocalBranch[0].referenceGuid = change.remoteHeadGuid;
    }
  }

  const remoteChangesPromise = makePromise(getRebasedChanges(change.remoteHeadGuid));
  return remoteChangesPromise.then((remoteChanges) => {
    const conflicts = [];
    for (const remoteChange of remoteChanges) {
      let applyAfterMetaInformation =
        commitsOnOtherLocalBranch[remoteChange.guid] !== undefined
          ? remoteChange.rebaseMetaInformation
          : undefined;

      let changeset = remoteChange.changeSet;
      if (changesOnOtherLocalBranch[0] !== undefined && changesOnOtherLocalBranch[0].guid === remoteChange.guid) {
        const invertedChange = new ChangeSet(_.cloneDeep(changesOnOtherLocalBranch[0].changeSet));
        invertedChange._toInverseChangeSet();
        invertedChange.applyChangeSet(rebaseBaseChangeSet);

        applyAfterMetaInformation = new Map();
        changeset = _.cloneDeep(changesOnOtherLocalBranch[0].changeSet);
        rebaseBaseChangeSet._rebaseChangeSet(changeset, conflicts, { applyAfterMetaInformation });

        // This is disabled for performance reasons. Only used during debugging
        // assert(_.isEqual(changeset,this.remoteChanges[i].changeSet),
        //                 "Failed Rebase in rebaseToRemoteChanges");
        rebaseBaseChangeSet = invertedChange;
        changesOnOtherLocalBranch.shift();
      }

      rebaseBaseChangeSet.applyChangeSet(changeset, {
        applyAfterMetaInformation,
      });
    }

    change.rebaseMetaInformation = new Map();
    rebaseBaseChangeSet._rebaseChangeSet(change.changeSet, conflicts, {
      applyAfterMetaInformation: change.rebaseMetaInformation,
    });
  })
}

function rebaseChangeArrays(baseChangeSet, changesToRebase) {
  let rebaseBaseChangeSet = baseChangeSet;
  for (const change of changesToRebase) {
    const copiedChangeSet = new ChangeSet(_.cloneDeep(change.changeSet));
    copiedChangeSet._toInverseChangeSet();

    const conflicts = [];
    change.rebaseMetaInformation = new Map();
    rebaseBaseChangeSet._rebaseChangeSet(change.changeSet, conflicts, {
      applyAfterMetaInformation: change.rebaseMetaInformation,
    });

    copiedChangeSet.applyChangeSet(rebaseBaseChangeSet);
    copiedChangeSet.applyChangeSet(change.changeSet, {
      applyAfterMetaInformation: change.rebaseMetaInformation,
    });
    rebaseBaseChangeSet = copiedChangeSet;
  }
}

module.exports = {
  rebaseToRemoteChanges
};
