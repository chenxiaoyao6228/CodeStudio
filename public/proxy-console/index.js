(function () {
  const originalConsole = window.console;
  window.console = new Proxy(originalConsole, {
    get(target, prop) {
      if (typeof target[prop] === "function") {
        return function (...args) {
          window.parent.postMessage(
            { type: "console", method: prop, data: args.map(handleArg) },
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
        return "undefined";
      case "null":
        return "null";
      case "boolean":
      case "number":
      case "bigint":
      case "string":
      case "symbol":
      case "function":
        return arg.toString();
      case "array":
        return `[Array(${arg.length})]`;
      case "date":
        return `[Date: ${arg.toISOString()}]`;
      case "regexp":
        return `[RegExp: ${arg.toString()}]`;
      case "map":
        return `[Map(${arg.size})]`;
      case "set":
        return `[Set(${arg.size})]`;
      case "weakmap":
        return "[WeakMap]";
      case "weakset":
        return "[WeakSet]";
      case "arraybuffer":
        return `[ArrayBuffer(${arg.byteLength})]`;
      case "dataview":
        return `[DataView(${arg.byteLength})]`;
      case "promise":
        return "[Promise]";
      case "object":
        return `[Object: ${JSON.stringify(arg)}]`;
      default:
        return "[Unknown]";
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
