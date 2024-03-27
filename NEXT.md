# Next Step

_This is only to help me pick up the work next time I have a moment._
_It is my way to apply the Hemingway Bridge method without commiting broken code._

The local cache is working, however

- Change approach to one that follows CQRS for existing functionality
- Update the tests to have better separation and control of fetching and return
- Remove the noRefreshSeconds option - fetch needs to finish a run, or explicitly reset the run. In the future a max run length might be useful.
- Don't update records of repos that were not updated

console.warn
Deprecation: [@octokit/request-error] `error.code` is deprecated, use `error.status`.
at RequestError.get (/Users/michal/Documents/Dev/repo-watcher/node_modules/@octokit/request-error/dist-node/index.js:70:11)
at isAssertionError (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/formatNodeAssertErrors.js:179:13)
at /Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/formatNodeAssertErrors.js:58:14
at Array.map (<anonymous>)
at formatNodeAssertErrors (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/formatNodeAssertErrors.js:39:43)
at dispatch (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/state.js:67:11)
at processTicksAndRejections (node:internal/process/task_queues:95:5)
at \_runTest (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/run.js:264:3)
at \_runTestsForDescribeBlock (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/run.js:126:9)
at \_runTestsForDescribeBlock (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/run.js:121:9)
at run (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/run.js:71:3)
at runAndTransformResultsToJestFormat (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:122:21)
at jestAdapter (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:79:19)
at runTestInternal (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-runner/build/runTest.js:367:16)
at runTest (/Users/michal/Documents/Dev/repo-watcher/node_modules/jest-runner/build/runTest.js:444:34)

octokit.rest.repos methods

'checkAutomatedSecurityFixes',
'checkCollaborator',
'checkVulnerabilityAlerts',
'codeownersErrors',
'compareCommits',
'compareCommitsWithBasehead',
'disableAutomatedSecurityFixes',
'disableDeploymentProtectionRule',
'disablePrivateVulnerabilityReporting',
'disableVulnerabilityAlerts',
'downloadArchive',
'downloadTarballArchive',
'downloadZipballArchive',
'enableAutomatedSecurityFixes',
'enablePrivateVulnerabilityReporting',
'enableVulnerabilityAlerts',
'generateReleaseNotes',
'listActivities',
'listAutolinks',
'listBranches',
'listBranchesForHeadCommit',
'listCollaborators',
'listCommentsForCommit',
'listCommitCommentsForRepo',
'listCommitStatusesForRef',
'listCommits',
'listContributors',
'listCustomDeploymentRuleIntegrations',
'listDeployKeys',
'listDeploymentBranchPolicies',
'listDeploymentStatuses',
'listDeployments',
'listForAuthenticatedUser',
'listForOrg',
'listForUser',
'listForks',
'listInvitations',
'listInvitationsForAuthenticatedUser',
'listLanguages',
'listPagesBuilds',
'listPublic',
'listPullRequestsAssociatedWithCommit',
'listReleaseAssets',
'listReleases',
'listTagProtection',
'listTags',
'listTeams',
'listWebhookDeliveries',
'listWebhooks',
'merge',
'mergeUpstream',
'pingWebhook',
'redeliverWebhookDelivery',
'removeAppAccessRestrictions',
'removeCollaborator',
'removeStatusCheckContexts',
'removeStatusCheckProtection',
'removeTeamAccessRestrictions',
'removeUserAccessRestrictions',
'renameBranch',
'replaceAllTopics',
'requestPagesBuild',
'testPushWebhook',
'transfer',
'uploadReleaseAsset'
'get',
'getAccessRestrictions',
'getAdminBranchProtection',
'getAllDeploymentProtectionRules',
'getAllEnvironments',
'getAllStatusCheckContexts',
'getAllTopics',
'getAppsWithAccessToProtectedBranch',
'getAutolink',
'getBranch',
'getBranchProtection',
'getBranchRules',
'getClones',
'getCodeFrequencyStats',
'getCollaboratorPermissionLevel',
'getCombinedStatusForRef',
'getCommit',
'getCommitActivityStats',
'getCommitComment',
'getCommitSignatureProtection',
'getCommunityProfileMetrics',
'getContent',
'getContributorsStats',
'getCustomDeploymentProtectionRule',
'getCustomPropertiesValues',
'getDeployKey',
'getDeployment',
'getDeploymentBranchPolicy',
'getDeploymentStatus',
'getEnvironment',
'getLatestPagesBuild',
'getLatestRelease',
'getOrgRuleSuite',
'getOrgRuleSuites',
'getOrgRuleset',
'getOrgRulesets',
'getPages',
'getPagesBuild',
'getPagesHealthCheck',
'getParticipationStats',
'getPullRequestReviewProtection',
'getPunchCardStats',
'getReadme',
'getReadmeInDirectory',
'getRelease',
'getReleaseAsset',
'getReleaseByTag',
'getRepoRuleSuite',
'getRepoRuleSuites',
'getRepoRuleset',
'getRepoRulesets',
'getStatusChecksProtection',
'getTeamsWithAccessToProtectedBranch',
'getTopPaths',
'getTopReferrers',
'getUsersWithAccessToProtectedBranch',
'getViews',
'getWebhook',
'getWebhookConfigForRepo',
'getWebhookDelivery'
