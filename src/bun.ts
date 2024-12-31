/**
 * WebSocket router API for Bun
 * @module
 */

import type { WebSocketHandler, Server, ServerWebSocket, Serve } from 'bun';
export type { ServerWebSocket };

type HandlerNames = 'message' | 'open' | 'close' | 'drain' | 'ping' | 'pong';

/**
 * The returned upgrade function
 */
export type UpgradeFunc<T> = undefined extends T
  ? (req: Request, options?: T) => boolean
  : (req: Request, options: T) => boolean;

/**
 * A list of WebSocket handlers
 */
export type Handler<T> = Pick<WebSocketHandler<T>, HandlerNames>;

/**
 * WebSocket options without handlers
 */
export type WebSocketOptions = Omit<WebSocketHandler<unknown>, HandlerNames>;

/**
 * Serve options with WebSocket options
 */
export type WebSocketServeOptions = Omit<
  // Extract all type that can specify websocket and replace
  // Their websocket type with an option type
  Extract<Serve<unknown>, { websocket: any }>, 'websocket'
> & { websocket?: WebSocketOptions };

/** @internal */
// eslint-disable-next-line
const noop = (): void => { };

/**
 * Create a WebSocket route
 * @param handler - A list of WebSocket handlers for that route
 * @returns The upgrade function associated with the route
 */
export const route = <T>(handler: Handler<T>): UpgradeFunc<T> => {
  const handlers: any[] = [
    handler.open ?? noop,
    handler.message,
    handler.close ?? noop,
    handler.drain ?? noop,
    handler.ping ?? noop,
    handler.pong ?? noop
  ];

  let server: Server | undefined;

  return (req: Request, data: any) => server == null
    ? (server = req as unknown as Server) as unknown as boolean
    : server.upgrade(req, { data: [handlers, data] });
};

/**
 * Load all routes into an existing server
 * @param routes - Defined routes to bind
 * @param server - The target Bun server
 */
export const loadRoutes = (routes: UpgradeFunc<unknown>[], server: Server): void => {
  routes.forEach((f) => f(server as unknown as Request));
};

/** @internal */
type Data = [((...args: any[]) => any)[], any];
/** @internal */
type DataHandler = Required<Handler<Data>>;
/** @internal */
type HandlerList = [
  DataHandler['open'],

  DataHandler['message'],
  DataHandler['close'], DataHandler['drain'],
  DataHandler['ping'], DataHandler['pong']
];
/** @internal */
type ServerSocket = ServerWebSocket<Data> & HandlerList;

/**
 * The common WebSocket handler for routes
 */
export const socketHandler: WebSocketHandler<any> = {
  open: (s: ServerSocket) => {
    const data = s.data;
    const handlers = data[0];

    // Load the actual data
    s.data = data[1];

    // Load all handlers
    s[1] = handlers[1];
    s[2] = handlers[2];
    s[3] = handlers[3];
    s[4] = handlers[4];
    s[5] = handlers[5];

    // Run the open handler
    handlers[0](s);
  },
  message: (s: ServerSocket, a) => { s[1](s, a); },
  close: (s: ServerSocket, a, b) => { s[2](s, a, b); },
  drain: (s: ServerSocket) => { s[3](s); },
  ping: (s: ServerSocket, a) => { s[4](s, a); },
  pong: (s: ServerSocket, a) => { s[5](s, a); }
};

/**
 * Start a Bun server with all the provided routes
 * @param options - Serve options with WebSocket options
 * @param routes - Defined routes to bind
 * @returns The created server
 */
export const serve = (options: WebSocketServeOptions, routes: UpgradeFunc<unknown>[]): Server => {
  const server = Bun.serve({
    ...options,
    websocket: 'websocket' in options
      ? { ...socketHandler, ...options.websocket }
      : socketHandler
  });
  loadRoutes(routes, server);
  return server;
};

// Auto-routing
const autoRoutes: UpgradeFunc<any>[] = [];

/**
 * Create a websocket handler and automatically register it to a list
 * @param handler - The handler to register
 * @returns The upgrade function associated with the route
 */
export const autoRoute = <T>(handler: Handler<T>): UpgradeFunc<T> => {
  const f = route(handler);
  autoRoutes.push(f);
  return f;
};

/**
 * Serve but with routes registered by `autoRoute`
 * @param options - Serve options with WebSocket options
 * @returns The created server
 */
export const autoServe = (options: WebSocketServeOptions): Server => serve(options, autoRoutes);
