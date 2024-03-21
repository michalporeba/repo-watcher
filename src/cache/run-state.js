"use strict";

export class RunState {
  constructor() {
    this.accounts = 0;
    this.repositories = 0;
    this.apicalls = {
      github: 0,
    };
  }
}
