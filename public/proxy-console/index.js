(function () {
  const originalConsole = window.console;
  window.console = new Proxy(originalConsole, {
    get(target, prop) {
      if (typeof target[prop] === "function") {
        return function (...args) {
          window.parent.postMessage({ method: prop, args }, "*");
          target[prop].apply(target, args);
        };
      }
      return target[prop];
    },
  });
})();
