# Plans

The external API should be as simple as possible.
At its very core it should be just `getRepositories(accounts);` for the default behaviour.

The above should start a local cache in a file system.
If there is no token, a warning should be displayed, or perhaps error thrown.
This could be overwritten with a flag to use public access.
If there enough API calls to reach out to GitHub API it should do it.
If not, cached version should be used.

Considering the size of the data and the time it will take to get it,
the collecting and analysing the data has to be split following CQRS principle.
