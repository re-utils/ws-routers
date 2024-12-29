/**
 * A simple pubsub topic module
 * @module
 */

type Shift<T extends unknown[]> = T extends [unknown, ...infer X] ? X : [];

/**
 * Describe a topic
 */
export type Topic<Args extends [any, ...any[]]> = [
  /**
   * A set of subscribers of the current topic
   */
  subscribers: Set<Args[0]>,

  /**
   * Publish to the current topic
   * @param args - The callback arguments
   * @returns `undefined`
   */
  publish: (...args: Shift<Args>) => void
];

/**
 * Create a topic
 * @param f - The callback function to apply for every subscriber
 * @returns The initialized topic
 */
export default <const Handler extends (x: any, ...args: any[]) => any>(f: Handler): Topic<Parameters<Handler>> => {
  const subs = new Set();
  return [
    subs,
    // A fast path
    f.length === 1
      ? () => { subs.forEach(f); }
      : (...args) => { for (const x of subs) f(x, ...args); }
  ];
};
