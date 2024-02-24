# Open Questions

- How to store array of values like topics, languages, so it is easy to analyse?
- What format should we support to store data?
- What to do with blob data, descriptions, README and so on?
- How to control API request number and plan processing?
- Should we use [Stream API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)?
- What would be useful output for focused summaries?
- How to prioritise data gathering? Should it be biggest or most popular repos first?
  Stars, watchers and forks combined? Should all possible information be captured first about a repo, or should be "theme" based?
- Should there be a refresh limit to prevent API calls when the data is relatively recent?
- If there is an order of processing, but the ideal refresh time has passed, should we continue with the planned order, or start from the top checking for updates?
