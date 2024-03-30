"use strict";

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

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(RunState.#PATH, this);
  }

  static async getFrom(cache) {
    let state = new RunState();
    const data = await cache.get(RunState.#PATH);
    Object.assign(state, data);
    return state;
  }
}
