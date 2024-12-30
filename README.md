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
import handleSocket from '/path/to/route';

export default (req: Request): Response => {
  // Similar to server.upgrade but run the handlers for that route only
  if (handleSocket(req, {
    id: Math.random()
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

## Deno
Example route:
```ts
import { route } from 'ws-routers/deno';

export default route<{ id: number }>({
  message(event) {
    // Access the current socket with `this`
    // Obtain the data passed in with `this.$`
    this.send(this.$.id + ':' + event.data);
  }
});
```

Use in a request handler:
```ts
import handleSocket from '/path/to/route';

export default (req: Request): Response => {
  if (req.headers.get("upgrade") === "websocket") {
    // The websocket is handled by the route
    const response = handleSocket(req, {
      $: { id: Math.random() }
    });

    // Do something with response...

    // Then return
    return response;
  }

  // Do other things...
}
```

## Topics
A very simple event model.
```ts
import event from 'ws-routers/event';

// Create a topic
const [subscribers, publish] = event((subscriber, ...args) => {
  // Do something with subscriber and args...
});

// Set operations
subscribers.add(subscriber);
subscribers.remove(subscriber);

// Publish some data to all subscribers (must match callback args)
publish(...args);
```
