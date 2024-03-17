/*
 * temporary code to explore what happenes when API limits are breached
 * run this without an API key and exhaust the first 60 requests
 * the get limits request still works and returns 200 with data
 * everything else results in an exception, with status 403 or 429
 * and useful information in the response headers
 */

import { createOctokit } from "./src/github-utils.js";

const makeSomeApiCalls = async (octokit) => {
  const { status, headers, data } = await octokit.rest.repos.listForUser({
    username: "michalporeba",
    type: "owner",
    per_page: 2,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  console.log(`RESPONSE STATUS: ${status}`);
  console.log(headers);
  return data;
};

const octokit = await createOctokit();

try {
  console.log(await octokit.getRateInfo());
  for (let i = 0; i < 1; i++) {
    await makeSomeApiCalls(octokit);
  }
  console.log(await octokit.getRateInfo());
} catch (err) {
  console.log("EXCEPTION WAS THROWN");
  console.log(err);
  console.log("TESTING ERR");
  console.log(`type of err: ${typeof err}`);
  console.log(`status: ${err.status}`);
  console.log(`mesage: ${err.response.data.message}`);
  console.log(`limit: ${err.response.headers["x-ratelimit-limit"]}`);
  console.log(`remaining: ${err.response.headers["x-ratelimit-remaining"]}`);
  console.log(`reset: ${err.response.headers["x-ratelimit-reset"]}`);
  console.log(`retry-after: ${err.response.headers["retry-after"]}`);
}

/*
 * an example output of running `node test-limits.js` after exhausting the limit

michal repo-watcher %node test-limits.js
{ limit: 60, remaining: 0, cooldown: 339.05200004577637 }
EXCEPTION WAS THROWN
RequestError [HttpError]: API rate limit exceeded for 86.166.174.112. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.) - https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting
    at /Users/michal/Documents/Dev/repo-watcher/node_modules/@octokit/request/dist-node/index.js:124:21
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///Users/michal/Documents/Dev/repo-watcher/src/github-utils.js:20:22
    at async makeSomeApiCalls (file:///Users/michal/Documents/Dev/repo-watcher/test-limits.js:12:37)
    at async file:///Users/michal/Documents/Dev/repo-watcher/test-limits.js:30:18 {
  status: 403,
  response: {
    url: 'https://api.github.com/users/michalporeba/repos?type=owner&per_page=2',
    status: 403,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Used, X-RateLimit-Resource, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, Deprecation, Sunset',
      'content-length': '280',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
      'content-type': 'application/json; charset=utf-8',
      date: 'Fri, 01 Mar 2024 11:09:56 GMT',
      'referrer-policy': 'origin-when-cross-origin, strict-origin-when-cross-origin',
      server: 'Varnish',
      'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'deny',
      'x-github-media-type': 'github.v3; format=json',
      'x-github-request-id': 'FEE9:1B1B8E:8047983:81D512F:65E1B783',
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1709291735',
      'x-ratelimit-resource': 'core',
      'x-ratelimit-used': '60',
      'x-xss-protection': '1; mode=block'
    },
    data: {
      message: "API rate limit exceeded for 86.166.174.112. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
      documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
    }
  },
  request: {
    method: 'GET',
    url: 'https://api.github.com/users/michalporeba/repos?type=owner&per_page=2',
    headers: {
      accept: 'application/vnd.github.v3+json',
      'user-agent': 'octokit-rest.js/20.0.2 octokit-core.js/5.1.0 Node.js/20.5.0 (darwin; x64)',
      'x-github-api-version': '2022-11-28'
    },
    request: { hook: [Function: bound bound register] }
  }
}
TESTING ERR
type of err: object
status: 403
mesage: API rate limit exceeded for 86.166.174.112. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)
limit: 60
remaining: 0
reset: 1709291735
retry-after: undefined
*/
