import {
  createOctokit,
  createRequestForOrgRepos,
  createRequestForUserRepos,
} from "./octokit-utils";

const getOrgRepositories = async (octokit, org) =>
  await octokit.paginate(
    octokit.rest.repos.listForOrg,
    createRequestForOrgRepos(org),
  );

const getUserRepositories = async (octokit, user) => {
  return await octokit.paginate(
    octokit.rest.repos.listForUser,
    createRequestForUserRepos(user),
  );
};

const getRepositoriesForAccount = async (octokit, type, name) => {
  try {
    let getter = type === "org" ? getOrgRepositories : getUserRepositories;
    return await getter(octokit, name);
  } catch (error) {
    console.error(`Error fetching repositories for ${type} ${name}!`, error);
  }
  return Promise.resolve([]);
};

const processAccount = async (octokit, { type, name, include }) =>
  new Promise(async (res) => {
    let repositories = await getRepositoriesForAccount(octokit, type, name);
    let filteredRepositories = repositories.filter(
      (r) => !include || include.includes(r.name),
    );
    console.log(
      `\nAccount ${name} has ${filteredRepositories.length} repositories`,
    );

    res(filteredRepositories.map(formatRepositoryDataFor(name)));
  });

export const getRepositories = async (
  accounts,
  { createOctokit = createOctokit },
) => {
  const octokit = await createOctokit();
  return (
    await Promise.allSettled(
      accounts.map((account) => processAccount(octokit, account)),
    )
  )
    .map(({ value }) => value)
    .flat();
};
