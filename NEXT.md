# Next Step

_This is only to help me pick up the work next time I have a moment._
_It is my way to apply the Hemingway Bridge method without commiting broken code._

The local cache is working, however

- Change approach to one that follows CQRS for existing functionality
- Update the tests to have better separation and control of fetching and return
- Remove the noRefreshSeconds option - fetch needs to finish a run, or explicitly reset the run. In the future a max run length might be useful.
- Don't update records of repos that were not updated
