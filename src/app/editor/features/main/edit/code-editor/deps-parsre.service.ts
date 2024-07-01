export enum ImportKind {
  Package = 'package',
  Relative = 'relative',
  Alias = 'alias',
  Reference = 'reference',
}

export interface ImportResult {
  kind: ImportKind;
  path: string;
}

export function parseImports(content: string) {
  const results: ImportResult[] = [];

  const packageImportRegex = /import\s.*\sfrom\s['"]([^'"]+)['"]/g;
  const commonJSImportRegex = /const\s.*=\srequire\(['"]([^'"]+)['"]/g;
  const referencePathRegex = /\/\/\/\s<reference\s.*path=['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;

  while ((match = packageImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('..')) {
      results.push({ kind: ImportKind.Relative, path: importPath });
    } else if (importPath.startsWith('@')) {
      results.push({ kind: ImportKind.Alias, path: importPath });
    } else {
      results.push({ kind: ImportKind.Package, path: importPath });
    }
  }

  while ((match = commonJSImportRegex.exec(content)) !== null) {
    results.push({ kind: ImportKind.Package, path: match[1] });
  }

  while ((match = referencePathRegex.exec(content)) !== null) {
    results.push({ kind: ImportKind.Reference, path: match[1] });
  }

  return results;
}

// all the combinations of imports
function pathTester() {
  const source = `
        import { Something } from 'some-package'; // Package import
        import { AnotherThing } from '@scope/another-package'; // Scoped package import
        import * as fs from 'node:fs'; // Node core module import
        const another = require('another-package'); // CommonJS require
        /// <reference path="./local-reference.ts" /> // TypeScript reference path

        // Relative imports
        import { LocalModule } from './local-module';
        import { LocalModuleInDir } from '../dir/local-module-in-dir';

        // TypeScript path alias imports
        import { AliasModule } from '@alias/alias-module';
        import { AnotherAliasModule } from '@another-alias/another-alias-module';

        // Sass file import
        import '../styles/main.scss';
  `;
  return source;
}
