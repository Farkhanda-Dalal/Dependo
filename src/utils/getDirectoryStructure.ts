import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export async function getDirectoryStructure(): Promise<any> {
  const workspaceRoot = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";
  if (!workspaceRoot) {
    return {};
  }
  const structure = {};
  function traverseDir(currentPath: string, parentObj: any) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    items.forEach((item) => {
      if (item.isDirectory() && item.name !== "node_modules") {
        const folderName = item.name;
        parentObj[folderName] = {};
        traverseDir(path.join(currentPath, folderName), parentObj[folderName]);
      }
    });
  }
  try {
    traverseDir(workspaceRoot, structure);
    return structure;
  } catch (e) {
    console.error("Error generating directory structure:", e);
    return {};
  }
}