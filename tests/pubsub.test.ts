import { describe, test, expect } from 'bun:test';
import topic from 'ws-routers/topic';

describe('Pubsub', () => {
  test('Topic', () => {
    const arr: number[] = [];
    const [addSubs, publishAdd] = topic((x: number, y: number) => {
      arr.push(x + y);
    });

    addSubs.add(1);
    addSubs.add(2);
    publishAdd(3);

    expect(arr).toEqual([4, 5]);
  });
});
