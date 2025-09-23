import resolve from "resolve";
import * as path from "path";

export function resolveImportPath(
  currentFilePath: string,
  importPath: string
): Promise<string | null> {
  return new Promise((res) => {
    resolve(
      importPath,
      {
        basedir: path.dirname(currentFilePath),
        extensions: [".js", ".jsx", ".ts", ".tsx", ".ejs", ".mjs", ".html"],
      },
      (error: Error | null, resolvedPath: string | undefined) => {
        if (error || !resolvedPath) {
          console.error(
            `Could not resolve import for '${importPath}' in file '${currentFilePath}'`
          );
          res(null);
        } else {
          res(resolvedPath);
        }
      }
    );
  });
}