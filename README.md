# Welcome!

Repo-watcher is a small JavaScript library with a big ambition - to foster better public code reuse.
An increasing number of organisations have adopted the idea of [Public Money, Public Code](https://publiccode.eu/en/).
[Some of them](https://government.github.com) have tens of thousands of public code repositories, often on GitHub.

Anecdotally, the code is often just dumped in the open.
It is not reused or even ready for reuse.
To improve this situation, we will need to understand it better first, but the sheer amount of such repositories makes it challenging to use the available APIs directly.

# What is repo-watcher?

Repo-watcher is focused on assisting in data collection using public APIs from websites like GitHub.
They often expose all the interesting data points but come with a rate limit too low to collect information about tens of thousands of repositories in one go.
Some properties have to be calculated, and some can only be observed over time.
At the same time, many of these repositories stay the same all the time and data, once collected, will remain valid for a long time, allowing for optimisation.

The library depends on caching information obtained between each run to build, over time, a reach dataset to support public code analytics.

# What is it not?

While some data aggregation might be provided, it is not the intention to provide in-depth analysis.
The focus is on providing data to be analysed in dedicated analytical projects (e.g. [x-gov-repos](https://github.com/michalporeba/x-gov-repos)).

While the cached data is accessible, it should not be considered data stored for analysis. It is up to specific analytical projects that choose to use repo-watcher to store the resulting information for analysis. The caching format can change as the library is developed.

# Why repo-watcher?

The "Public Code, Public Money" is the right idea, but its value is limited without reuse.
Collecting and analysing data about public code-bases and patterns of their reuse will enable better public code reuse and better value for (public) money.

# Getting involved!

The project is in its very early stages.
Whether you're looking to use repo-watcher to analyse public code, you look after,
or to contribute to its development because you think that it might be a good idea, or for any other reason,
your involvement is welcome. Here's how you can get started:

- **Ideas and direction**: The project comes from many discussions about public code reuse in the UK and Europe.
  But it is, at the moment, just one perspective.
  Get involved if you have ideas on how to improve what we should capture about the repositories by [starting a discussion](https://github.com/michalporeba/repo-watcher/issues).
- **Contributing**: This, itself, is a public code, open-source software.
  Your contributions are invaluable! Whether it's code, documentation, testing, or issue reporting, every bit helps.
- **Using repo-watcher**: We are not quite there yet.
  But we will soon. If you have ideas of what this project can enable you to do, consider the above two points.
- **Feedback**: Have suggestions or feedback?
  Please share them in [issues](https://github.com/michalporeba/repo-watcher/issues), or by contacting [Michał](https://github.com/michalporeba).

&nbsp;
_Let's make public code more accessible, usable, and impactful._

&nbsp;

# Testing

The testing is done using [jest](https://jestjs.io/).
To execute integration tests you will need a GitHub API token stored in `GITHUB_TOKEN` environmental variable. Once this is set up, you can do:

```bash
npm install
npm run test
```

It is possible to execute unit and integration tests separatly like so:

```bash
npm run test:unit
npm run test:integration
```
