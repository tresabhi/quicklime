# Quicklime <img src="https://i.imgur.com/MlEo9HD.png" alt="Verne Logo" width="90" height="90" align="right">

A bare bones event dispatcher.

## Installation

```bash
npm install quicklime
```

## Usage

Start by creating an instance of the Quicklime class:

```js
const myEvent = new Quicklime();
```

If you desire to pass any sort of data, in TypeScript you can pass a type:

```ts
const myEvent = new Quicklime<string>();
```

### Adding Callbacks

Callbacks are called each time the event is dispatched. Anonymous functions work great with the `on` method:

```ts
import { Quicklime } from "quicklime";

myEvent.on(() => console.log("myEvent was dispatched!"));
```

Enjoy the OOP goodness by chaining methods:

```ts
myEvent
  .on(() => console.log("callback 1"))
  .on(() => console.log("callback 2"))
  .on(() => console.log("callback 3"))
  .on(() => console.log("callback 4"));
```

However, if you would like your callback to only be called once, use the `once` method:

```ts
myEvent.once(() => console.log("myEvent was dispatched once!"));
```

### Accessing Event Data

```ts
myEvent.on((event) => {
  console.log(`And the event said, "${event.data}"`);
});
```

You also have access to the data from the last dispatch:

```ts
myEvent.on((event) => {
  console.log(`Remember when I was like, "${event.last}"`);
});
```

By default, the last data is `null` until the first dispatch happens. If you desire, you can pass an initial value for `last` so that it is never null. Note that due to limitations on how TypeScript manages types in classes, the type of `last` will still be `Type | null` even if you pass an initial value for it:

```ts
const myEventWithoutInitial = new Quicklime<string>();
// this'll be null
myEventWithoutInitial.on((event) => console.log(event.last)).dispatch();

// note that you don't have to pass a Type anymore since it's inferred
const myEventWithInitial = new Quicklime("initial value");
// this'll be "initial value"
myEventWithInitial.on((event) => console.log(event.last)).dispatch();
```

### Stopping Propagation

```ts
myEvent
  .on(() => console.log("callback 1")) // this will logged
  .on(() => console.log("callback 2")) // this too
  .on((event) => event.stopPropagation()) // nothing here
  .on(() => console.log("callback 3")) // this is never reached
  .on(() => console.log("callback 4")); // nor is this
```

### Dispatching the Event

The event can be dispatched with whatever data you want:

```ts
myEvent.dispatch("My name is Quicklime");
```

### Removing Callbacks

If you would like to remove a callback, make sure you save a reference to it before using the `on` method so that you can later use the `off` method:

```ts
function myCallback() {
  console.log("don't forget about me :)");
}

myEvent.on(myCallback);
myEvent.off(myCallback);
```

Or go nuclear and remove all callbacks:

```ts
myEvent.clear();
```

### Awaiting the Next Event

There is an in-built way to create a promise that waits for the next call:

```ts
const event = await myEvent.next();
console.log(`Then I replied, "${event.data}"`);
```

### Accessing All Callbacks

Note that this is a JavaScript `Set`:

```ts
myEvent.callbacks.forEach((callback) => console.log(callback));
```

## Behavior

Errors don't stop all callbacks from being called and are logged properly to the console with the correct stack trace:

```ts
myEvent
  .on(() => console.log("callback 1")) // this will be logged
  .on(() => console.log("callback 2")) // so will this
  .on(() => {
    // this error will happen between callbacks 2 and 3
    throw new Error("He's behind me, isn't he?");
  })
  .on(() => console.log("callback 3")) // this is logged nevertheless
  .on(() => console.log("callback 4")); // this too
```

All calls are asynchronous so no callback can delay another:

```ts
myEvent
  .on(async () => {
    const response = await fetch("https://some-really.com/big-file");
    const data = await response.arrayBuffer();
    console.log(data);
  }) // this will take a while to run
  .on(() => console.log("I am fast")); // so this will end up logging first
```

Stop propagation only works if you are quick enough to call it before Quicklime is done calling all callbacks. In other words, if you are asynchronous, you can't stop propagation:

```ts
myEvent
  .on(async (event) => {
    const response = await fetch("https://some-really.com/big-file");
    await response.arrayBuffer();

    event.stopPropagation(); // useless call
  })
  .on(() => console.log("I am fast")); // this will log
```
