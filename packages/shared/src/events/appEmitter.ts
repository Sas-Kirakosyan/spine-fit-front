
type Events = {
  START_WORKOUT: () => void
}

import EventEmitter from "eventemitter3";


export const appEmitter = new EventEmitter<Events>();



// Usage Example:
// appEmitter.emit("START_WORKOUT");
// appEmitter.on("START_WORKOUT", () => { /* handler code */ });