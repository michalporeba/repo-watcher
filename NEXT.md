# Next Step

_This is only to help me pick up the work next time I have a moment._
_It is my way to apply the Hemingway Bridge method without commiting broken code._

The local cache is working, however

- The state returned by `getRepositories` is hardcoded.
- the rate limiting plugin won't return anything if there were no calls. It should make a call to rate limit endpoint in that situation.
