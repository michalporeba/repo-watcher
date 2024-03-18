"use strict";

export class ProcessState {
  static #PATH = "process.state";
  constructor() {
    this.repositories = {
      discovered: 0,
      collected: 0,
      remaining: 0,
    };
  }

  async saveTo(cache) {
    this.timestamp = Math.floor(Date.now() / 1000);
    await cache.set(ProcessState.#PATH, this);
  }

  static async getFrom(cache) {
    let state = new ProcessState();
    const data = await cache.get(ProcessState.#PATH);
    Object.assign(state, data);
    return state;
  }
}
