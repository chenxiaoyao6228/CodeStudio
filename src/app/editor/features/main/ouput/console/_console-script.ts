(function () {
  const originalConsole: Console = window.console;

  window.console = new Proxy(originalConsole, {
    get(target: Console, prop: keyof Console & string) {
      const originalProp = target[prop] as any;
      if (typeof originalProp === 'function') {
        return function (...args: any[]) {
          window.parent.postMessage(
            { type: 'console', method: prop, args: args.map(handleArg) },
            '*'
          );
          return originalProp.apply(target, args);
        };
      }
      return originalProp;
    },
  });

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data.type === 'execute' && event.data.code) {
      try {
        const evalRes = eval(event.data.code);
        console.log(evalRes);
      } catch (error) {
        console.error('Error executing code:', error);
      }
    }
  });

  function sendErrorEvent(event: ErrorEvent) {
    window.parent.postMessage(
      {
        type: 'error',
        message: event.message,
        codeInfo: event.lineno
          ? `${event.filename}:${event.lineno}: ${event.colno}`
          : '',
        stacks: event.error && event.error.stack.split('\n'),
      },
      '*'
    );
  }

  window.addEventListener('error', (event: ErrorEvent) => {
    sendErrorEvent(event);
  });

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      window.parent.postMessage(
        {
          type: 'error',
          message: event.reason,
        },
        '*'
      );
    }
  );

  function handleArg(arg: any): { type: string; value: any } {
    const type = checkType(arg);
    switch (type) {
      case 'undefined':
        return { type: 'undefined', value: 'undefined' };
      case 'null':
        return { type: 'null', value: 'null' };
      case 'boolean':
      case 'number':
      case 'string':
      case 'symbol':
      case 'function':
        return { type, value: arg.toString() };
      case 'bigint':
        return { type, value: arg.toString() + 'n' };
      case 'date':
        return { type, value: (arg as Date).toISOString() };
      case 'regexp':
        return { type, value: arg.toString() };
      case 'array':
        return { type, value: arg.map((o: any) => handleArg(o)) };
      case 'object': {
        const formattedObj: Record<string, any> = {};
        for (const key in arg) {
          if (Object.prototype.hasOwnProperty.call(arg, key)) {
            formattedObj[key] = handleArg(arg[key]);
          }
        }
        return { type, value: formattedObj };
      }
      case 'map':
        return {
          type: 'map',
          //@ts-expect-error skip
          value: Array.from(arg.entries()).map(([key, value]: [any, any]) => [
            handleArg(key),
            handleArg(value),
          ]),
        };
      case 'set':
        return {
          type: 'set',
          value: Array.from(arg.values()).map((value: any) => handleArg(value)),
        };
      case 'promise':
        return { type: 'promise', value: '[Promise]' };
      case 'weakmap':
        return { type: 'weakmap', value: '[WeakMap]' };
      case 'weakset':
        return { type: 'weakset', value: '[WeakSet]' };
      case 'typedarray':
        return {
          type: 'typedarray',
          value: [`[TypeArray(${arg.length})]`],
        };
      case 'arraybuffer':
        return {
          type: 'arraybuffer',
          value: `[ArrayBuffer(${arg.byteLength})]`,
        };
      case 'dataview':
        return { type: 'dataview', value: `[DataView(${arg.byteLength})]` };
      case 'error':
        sendErrorEvent(arg);
        return { type: 'error', value: arg.message };
      default:
        return { type: 'unknown', value: '[Unknown]' };
    }
  }

  function checkType(value: any): string {
    if (value === null) {
      return 'null';
    }

    const type = typeof value;

    if (type === 'undefined') {
      return 'undefined';
    }
    if (type === 'boolean') {
      return 'boolean';
    }
    if (type === 'number') {
      return 'number';
    }
    if (type === 'bigint') {
      return 'bigint';
    }
    if (type === 'string') {
      return 'string';
    }
    if (type === 'symbol') {
      return 'symbol';
    }
    if (type === 'function') {
      return 'function';
    }
    if (type === 'object') {
      if (Array.isArray(value)) {
        return 'array';
      }
      if (value instanceof Date) {
        return 'date';
      }
      if (value instanceof RegExp) {
        return 'regexp';
      }
      if (value instanceof Map) {
        return 'map';
      }
      if (value instanceof Set) {
        return 'set';
      }
      if (value instanceof WeakMap) {
        return 'weakmap';
      }
      if (value instanceof WeakSet) {
        return 'weakset';
      }
      if (value instanceof ArrayBuffer) {
        return 'arraybuffer';
      }
      if (ArrayBuffer.isView(value)) {
        return 'typedarray';
      }
      if (value instanceof DataView) {
        return 'dataview';
      }
      if (value instanceof Promise) {
        return 'promise';
      }
      if (value instanceof Error) {
        return 'error';
      }
      return 'object';
    }

    return 'unknown';
  }

  console.log('[CodeStudio]: 😊 happy coding!');
})();
