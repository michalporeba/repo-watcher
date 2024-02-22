import { Octokit } from "@octokit/rest";
import {
  createOctokit,
  createRequestForOrgRepos,
  createRequestForUserRepos,
} from "./octokit-utils";

const octokit = createOctokit();

const getOrgRepositories = async (org) =>
  await octokit.paginate(
    octokit.rest.repos.listForOrg,
    createRequestForOrgRepos(org),
  );

const getUserRepositories = async (user) => {
  console.log("GETTING USER REPOS");
  //console.log(Octokit);
  //console.log(octokit);
  return await octokit.paginate(
    octokit.rest.repos.listForUser,
    createRequestForUserRepos(user),
  );
};

const getRepositoriesForAccount = async (type, name) => {
  try {
    let getter = type === "org" ? getOrgRepositories : getUserRepositories;
    return await getter(name);
  } catch (error) {
    console.error(`Error fetching repositories for ${type} ${name}!`, error);
  }
  return Promise.resolve([]);
};

const processAccount = async ({ type, name, include }) =>
  new Promise(async (res) => {
    let repositories = await getRepositoriesForAccount(type, name);
    let filteredRepositories = repositories.filter(
      (r) => !include || include.includes(r.name),
    );
    console.log(
      `\nAccount ${name} has ${filteredRepositories.length} repositories`,
    );

    res(filteredRepositories.map(formatRepositoryDataFor(name)));
  });

export const getRepositories = async (accounts) => {
  console.log(accounts);
  return (await Promise.allSettled(accounts.map(processAccount)))
    .map(({ value }) => value)
    .flat();
};
