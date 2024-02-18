import sut from '../src/index';

describe('index.js', () => {
  test('repo watcher adds two numbers together', () => {
    const result = sut.add(19, 88);
    expect(result).toEqual(107);
  });
});