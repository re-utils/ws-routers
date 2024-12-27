/**
 * WebSocket router API for Deno
 * @module
 */

/**
 * A server socket
 */
export interface ServerWebSocket<T> extends WebSocket {
  /**
   * Data sent by upgrading
   */
  $: T;
}

/**
 * A list of WebSocket handlers
 */
export interface Handler<T> {
  open?: ServerWebSocket<T>['onopen'] & {};
  message?: ServerWebSocket<T>['onmessage'] & {};
  error?: ServerWebSocket<T>['onerror'] & {};
  close?: ServerWebSocket<T>['onclose'] & {};
}

/**
 * The returned upgrade function
 */
type UpgradeFunc<T> = undefined extends T
  ? (req: Request, opts?: Deno.UpgradeWebSocketOptions & { $?: T }) => Response
  : (req: Request, opts: Deno.UpgradeWebSocketOptions & { $: T }) => Response;

/**
 * Create a WebSocket route
 * @param handler - A list of WebSocket handlers for that route
 * @returns The upgrade function associated with the route
 */
export const route = <T>(handler: Handler<T>): UpgradeFunc<T> => {
  const data = [handler.open ?? null, handler.message ?? null, handler.error ?? null, handler.close ?? null] as const;

  // @ts-expect-error Type is not assignable fr
  return (req: Request, opts: Deno.UpgradeWebSocketOptions & { $: T }) => {
    const res = Deno.upgradeWebSocket(req);
    const s = res.socket as ServerWebSocket<T>;

    // Load the passed data
    if (opts.$ != null)
      s.$ = opts.$;

    // Load event handlers
    s.onopen = data[0];
    s.onmessage = data[1];
    s.onerror = data[2];
    s.onclose = data[3];

    return res.response;
  };
};
