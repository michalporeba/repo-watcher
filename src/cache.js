"use strict";

export const streamRepositoriesFromCache = async function* (account, cache) {
  for (const r in account?.repositories) {
    yield cache.get(account.repositories[r].path);
  }
};
