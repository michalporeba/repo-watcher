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

  addAccount(action, params) {
    this.accounts.total += 1;
    this.accounts.remaining += 1;
    this.addTask(action, params);
  }

  addTask(action, params) {
    this.tasks.unshift({ action, params });
  }

  hasTasks() {
    return this.tasks.length > 0;
  }

  nextTask() {
    this.current = this.tasks.shift();
    return this.current;
  }

  undoLastTask() {
    if (this.current) {
      this.addTask(this.current);
      this.current = undefined;
    }
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
