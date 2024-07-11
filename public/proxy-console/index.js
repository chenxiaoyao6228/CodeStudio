(function () {
  const originalConsole = window.console;
  window.console = new Proxy(originalConsole, {
    get(target, prop) {
      if (typeof target[prop] === "function") {
        return function (...args) {
          window.parent.postMessage(
            { type: "console", method: prop, args: args.map(handleArg) },
            "*"
          );
          target[prop].apply(target, args);
        };
      }
      return target[prop];
    },
  });

  function handleArg(arg) {
    const type = checkType(arg);
    switch (type) {
      case "undefined":
        return { type: "undefined", value: "undefined" };
      case "null":
        return { type: "null", value: "null" };
      case "boolean":
      case "number":
      case "string":
      case "symbol":
      case "function":
        return { type, value: arg.toString() };
      case "bigint":
        return { type, value: arg.toString() + "n" };
      case "date":
        return { type, value: arg.toISOString() };
      case "regexp":
        return { type, value: arg.toString() };
      case "array":
        return { type, value: arg.map((o) => handleArg(o)) };
      case "object":
        const formattedObj = {};
        for (const key in arg) {
          if (arg.hasOwnProperty(key)) {
            formattedObj[key] = handleArg(arg[key]);
          }
        }
        return { type, value: formattedObj };
      case "map":
        return {
          type: "map",
          value: Array.from(arg.entries()).map(([key, value]) => [
            key,
            handleArg(value),
          ]),
        };
      case "set":
        return {
          type: "set",
          value: Array.from(arg.values()).map((value) => handleArg(value)),
        };
      case "promise":
        return { type: "promise", value: "[Promise]" };
      case "weakmap":
        return { type: "weakmap", value: "[WeakMap]" };
      case "weakset":
        return { type: "weakset", value: "[WeakSet]" };
      case "typedarray":
        return {
          type: "typedarray",
          value: [`[TypeArray(${arg.length})]`],
        };
      case "arraybuffer":
        return {
          type: "arraybuffer",
          value: `[ArrayBuffer(${arg.byteLength})]`,
        };
      case "dataview":
        return { type: "dataview", value: `[DataView(${arg.byteLength})]` };
      default:
        return { type: "unknown", value: "[Unknown]" };
    }
  }

  function checkType(value) {
    if (value === null) {
      return "null";
    }

    const type = typeof value;

    if (type === "undefined") {
      return "undefined";
    }
    if (type === "boolean") {
      return "boolean";
    }
    if (type === "number") {
      return "number";
    }
    if (type === "bigint") {
      return "bigint";
    }
    if (type === "string") {
      return "string";
    }
    if (type === "symbol") {
      return "symbol";
    }
    if (type === "function") {
      return "function";
    }
    if (type === "object") {
      if (Array.isArray(value)) {
        return "array";
      }
      if (value instanceof Date) {
        return "date";
      }
      if (value instanceof RegExp) {
        return "regexp";
      }
      if (value instanceof Map) {
        return "map";
      }
      if (value instanceof Set) {
        return "set";
      }
      if (value instanceof WeakMap) {
        return "weakmap";
      }
      if (value instanceof WeakSet) {
        return "weakset";
      }
      if (value instanceof ArrayBuffer) {
        return "arraybuffer";
      }
      if (ArrayBuffer.isView(value)) {
        return "typedarray";
      }
      if (value instanceof DataView) {
        return "dataview";
      }
      if (value instanceof Promise) {
        return "promise";
      }
      return "object";
    }

    return "unknown";
  }
})();
