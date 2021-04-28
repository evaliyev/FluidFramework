/*!
 * Copyright (c) Autodesk, Inc. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint no-unused-expressions: 0 */
const { generateGUID } = require('@fluid-experimental/property-common').GuidUtils;
const { ChangeSet } = require('@fluid-experimental/property-changeset');
const createMhs = require('../utils/create_mhs');

describe('Commit rebasing', () => {
  let mhService;
  before(() => {
    ({ mhService } = createMhs({
      'mh:chunkSize': 16
    }));
    return mhService.init();
  });

  after(() => mhService.stop());

  describe('with four commits', () => {
    // This test creates a branch with three commits, which create a string, modify it and finally remove it
    // It will then try to create a commit that modifies the string relative to the first commit in the branch.
    //Without rebasing this fails, because the string has been removed.
    let branchGuid, firstCS, secondCS, firstCommitGuid, secondCommitGuid, thirdCommitGuid, fourthCommitGuid;
    before(async () => {
      branchGuid = generateGUID();
      const rootCommitGuid = generateGUID();
      firstCS = {
        insert: {
          String: {
            a: 'Hello'
          }
        }
      };

      await mhService.createBranch({
        guid: branchGuid,
        rootCommitGuid,
        meta: {}
      });
      firstCommitGuid = generateGUID();
      await mhService.createCommit({
        guid: firstCommitGuid,
        meta: {},
        branchGuid,
        parentGuid: rootCommitGuid,
        changeSet: firstCS
      });


      secondCS = {
        modify: {
          String: {
            a: 'Hello World'
          }
        }
      };
      secondCommitGuid = generateGUID();
      await mhService.createCommit({
        guid: secondCommitGuid,
        meta: {},
        branchGuid,
        parentGuid: firstCommitGuid,
        changeSet: secondCS,
        rebase: true
      });

      thirdCS = {
        remove: {
          String: {
            a: 'Hello'
          }
        }
      };
      thirdCommitGuid = generateGUID();
      await mhService.createCommit({
        guid: thirdCommitGuid,
        meta: {},
        branchGuid,
        parentGuid: secondCommitGuid,
        changeSet: thirdCS
      });
    });

    it('sucessfully apply the fourth commit', async () => {
      fourthCS = {
        modify: {
          String: {
            a: 'Bye Bye'
          }
        }
      };
      fourthCommitGuid = generateGUID();
      await mhService.createCommit({
        guid: fourthCommitGuid,
        meta: {},
        branchGuid,
        parentGuid: firstCommitGuid,
        changeSet: fourthCS,
        rebase: true
      });

      // We expect the created commit to have an empty ChangeSet after rebasing
      let fourthCommitRebasedCS = await mhService.getCommitCS({
        guid: fourthCommitGuid,
        branchGuid
      });
      expect(fourthCommitRebasedCS.changeSet).to.be.empty;
    });
    /*it('should keep a normalized MV', async () => {
      const resultChangeSet = new ChangeSet();
      resultChangeSet.applyChangeSet(firstCS);
      resultChangeSet.applyChangeSet(secondCS);
      const fetched = await mhService.getCommitMV({
        guid: secondCommitGuid,
        branchGuid
      });
      expect(fetched.changeSet).to.eql(JSON.parse(resultChangeSet.toString()));
    });

    it('should return the correct result for a partial checkout', async () => {
      const fetched = await mhService.getCommitMV({
        guid: firstCommitGuid,
        branchGuid,
        paths: ['b.a']
      });
      expect(fetched.changeSet).to.eql({
        insert: {
          NodeProperty: {
            b: {}
          }
        }
      });
    });*/
  });
});
