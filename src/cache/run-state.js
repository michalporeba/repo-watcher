"use strict";

import crypto from "crypto";

export class RunState {
  static #PATH = "current.run.state";

  constructor() {
    this.accounts = 0;
    this.repositories = 0;
    this.apicalls = {
      github: 0,
    };
    this.tasks = [];
  }

  addTask(action, params) {
    this.tasks.push({ action, params });
  }

  *streamTasks() {
    yield* this.tasks;
  }

  static #hash(object) {
    const data = JSON.stringify(object, null, 2);
    return crypto.createHash("md5").update(data).digest("hex");
  }

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(RunState.#PATH, this);
  }

  static async retrievOrCreate(cache, accounts) {
    const hash = RunState.#hash(accounts);
    const state = await RunState.getFrom(cache);

    if (state.hash != hash && state.tasks.length == 0) {
      for (const account of accounts) {
        state.addTask("reviewRepositories", account);
      }
    }

    return state;
  }

  static async getFrom(cache) {
    let state = new RunState();
    const data = await cache.get(RunState.#PATH);
    Object.assign(state, data);
    return state;
  }
}
