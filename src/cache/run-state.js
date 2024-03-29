"use strict";

import crypto from "crypto";

export class RunState {
  static #PATH = "current.run.state";

  constructor() {
    this.accounts = {
      total: 0,
      processed: 0,
      remaining: 0,
    };
    this.repositories = 0;
    this.apicalls = {
      github: 0,
    };
    this.tasks = [];
  }

  addTask(action, params) {
    this.tasks.unshift({ action, params });
  }

  hasTasks() {
    return this.tasks.length > 0;
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
      state.accounts.total = 0;
      for (const account of accounts) {
        state.accounts.total += 1;
        state.accounts.remaining += 1;
        state.addTask("reviewRepositories", account);
      }
      await state.saveTo(cache);
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
