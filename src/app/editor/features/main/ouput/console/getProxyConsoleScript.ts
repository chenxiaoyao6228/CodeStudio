// @ts-expect-error skip
import { proxyConsoleScript } from './_console-script.js';
/**
 * due to "CROS policy", we can't directly inject script to iframe
 * cuz the domain of iframe are not the same as the main
 * so we have to some how inject the script to the index.html
 * before the project loaded to webContainer
 */
function getProxyConsoleScript() {
  return `<script id='code-studio-proxy-console-script'>
   // This script is for code-studio proxy console, please do not remove this script
   // it's dynamic injected and will not saved to your code base
     ${proxyConsoleScript}
  </script>`;
}

function uint8ArrayToString(array: Uint8Array): string {
  return new TextDecoder().decode(array);
}

// rewrite html and inject script
export function injectProxyScriptToEntryHTML(contents: string | Uint8Array) {
  const proxyScript = getProxyConsoleScript();

  if (contents instanceof Uint8Array) {
    contents = uint8ArrayToString(contents);
  }

  // Inject script before the closing </head> tag
  return contents.replace('</head>', `${proxyScript}</head>`);
}

/**
 * for simplicity, we assume there is only on index.html file
 * usually index.html , src/index.html or build/index.html
 * for other scenarios like webpack multi-page, we just don't handle that
 */
export function isEntryFile(path: string) {
  return path.endsWith('index.html');
}

export function removeProxyScriptOfEntryHTML(
  contents: string | Uint8Array
): string {
  if (contents instanceof Uint8Array) {
    contents = uint8ArrayToString(contents);
  }

  const proxyScriptRegex =
    /<script id='code-studio-proxy-console-script'>.*?<\/script>/s;

  return contents.replace(proxyScriptRegex, '');
}
