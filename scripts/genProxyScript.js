const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");
const { minify } = require("terser");

const inputFilePath = path.resolve(
  __dirname,
  "../src/app/editor/features/main/ouput/console/_console-script.ts"
);
const outputFileStringPath = path.resolve(
  __dirname,
  "../src/app/editor/features/main/ouput/console/_console-script.js"
);
const outputFilePath = path.resolve(
  __dirname,
  "../public/proxy-console/index.js"
);

const babelOptions = {
  presets: ["@babel/preset-env", "@babel/preset-typescript"],
};

babel.transformFile(inputFilePath, babelOptions, async (err, result) => {
  if (err) {
    console.error("Error during Babel transformation:", err);
    return;
  }

  try {
    const minified = await minify(result.code, {
      output: {
        comments: false,
      },
    });

    const escapedCode = minified.code
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/`/g, "\\`") // Escape backticks
      .replace(/\$/g, "\\$") // Escape dollar signs
      .replace(/\r?\n|\r/g, "\\n"); // Escape newlines
    const outputString = `export const proxyConsoleScript = \`${escapedCode}\`;`;

    fs.writeFileSync(
      outputFilePath,
      `// This file is auto-generated, please do not modify by hand
${minified.code}`
    );
    fs.writeFileSync(
      outputFileStringPath,
      `// This file is auto-generated, please do not modify by hand
${outputString}`
    );
    console.log(
      "TypeScript file has been transpiled and output to public/proxy-console/index.js"
    );
  } catch (minifyErr) {
    console.error("Error during minification:", minifyErr);
  }
});
