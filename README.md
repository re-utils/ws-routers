# Websocket routers
Runtime-specific websocket routers built for performance.

## Bun
Example route:
```ts
import { autoRoute } from 'ws-routers/bun';

export default autoRoute<{ id: number }>({
  message: (ws, msg) => {
    ws.send(ws.data.id + ':' + msg);
  }
});
```

Use in a request handler:
```ts
import handleWS from '/path/to/route';

export default (req) => {
  // Similar to server.upgrade but run the handlers for that route only
  if (handleWS(req, {
    name: Math.round(Math.random())
  })) return;

  // Do other things...
}
```

And serve with `autoServe` instead of `Bun.serve`:
```ts
import { autoServe } from 'ws-routers/bun';

autoServe({
  fetch: myRequestHandler,
  port: 3000,
  // Other options...
});
```
