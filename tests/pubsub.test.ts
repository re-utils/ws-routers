import { describe, test, expect } from 'bun:test';
import event from 'ws-routers/event';

describe('Pubsub', () => {
  test('Event', () => {
    const arr: number[] = [];
    const [addSubs, publishAdd] = event((x: number, y: number) => {
      arr.push(x + y);
    });

    addSubs.add(1);
    addSubs.add(2);
    publishAdd(3);

    expect(arr).toEqual([4, 5]);
  });
});
