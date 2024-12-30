/// <reference types="@cloudflare/workers-types" />
/**
 * WebSocket router API for Cloudflare Workers
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
 * Describe a WebSocket pair
 */
export interface WebSockets<T> {
  /**
   * The client socket
   */
  // eslint-disable-next-line
  0: WebSocket;

  /**
   * The server socket
   */
  // eslint-disable-next-line
  1: ServerWebSocket<T>;
}

/**
 * The returned upgrade function
 */
type UpgradeFunc<T> = undefined extends T
  ? (opts?: T) => WebSockets<T>
  : (opts: T) => WebSockets<T>;

/**
 * Create a WebSocket route
 * @param handler - A list of WebSocket handlers for that route
 * @returns The upgrade function associated with the route
 */
export const route = <T>(handler: Handler<T>): UpgradeFunc<T> => {
  const data = [handler.open ?? null, handler.message ?? null, handler.error ?? null, handler.close ?? null] as const;

  // @ts-expect-error Type is not assignable fr
  return (opts: T) => {
    const sockets = new WebSocketPair();

    // Accept the connection
    const s = sockets[1] as ServerWebSocket<T>;
    s.accept();

    // Load the passed data
    if (opts != null)
      s.$ = opts;

    // Load event handlers
    s.onopen = data[0];
    s.onmessage = data[1];
    s.onerror = data[2];
    s.onclose = data[3];

    return s;
  };
};
