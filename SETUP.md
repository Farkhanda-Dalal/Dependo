# VS Code Extension Setup

## Step 1: Initial Setup and Scaffolding (Pre-requisites)

This step involved setting up the development environment and creating the initial extension project structure.

| Task                 | Command/Tool                       | Description                                                                                                                                             |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install Global Tools | `npm install -g yo generator-code` | Installs the Yeoman scaffolding tool (`yo`) and the VS Code Extension Generator (`generator-code`) globally to make the commands available system-wide. |
| Project Build Tool   | `esbuild`                          | Recommended for new projects due to its speed and simplicity for efficient development.                                                                 |

---

## Step 2: Parsing Project Files and Building the Graph Data

This is the core logic for reading files, finding dependencies, and structuring the graph data.

### Step 2.1: Installing the Parser

We used the Babel parser to handle modern JavaScript and TypeScript syntax.

```bash
npm install @babel/parser
```

---

### Step 2.2: The Core Parsing Logic (`src/parser.ts`)

A new file, `src/parser.ts`, was created to house the graph generation logic.

**Data Structure:** Defined the `GraphData` interface for the resulting JSON structure.

```typescript
export interface GraphData {
    nodes: { id: string }[];
    links: { source: string; target: string }[];
}
```

**Core Function (`getDependencyGraph`):**

* Finds all relevant files (`.js`, `.jsx`, `.ts`, `.tsx`) in the workspace, explicitly ignoring `**/node_modules/**`.
* Reads the content of each file.
* Uses `@babel/parser` to create an Abstract Syntax Tree (AST) for each file, with support for `jsx` and `typescript` plugins.
* Traverses the AST to find `ImportDeclaration` nodes.
* For each import, it attempts to resolve the path to a file within the workspace.
* Creates a node for the current file and the imported file (if it doesn't exist) and adds a link (edge) from the current file (source) to the imported file (target).

**Helper Function (`resolveImportPath`):**

* Handles relative imports (`./`, `../`) by resolving the full path.
* Appends common extensions (`.js`, `.ts`, etc.) and `/index` files to find the correct file on the disk (`fs.existsSync`).

---

### Step 2.3: Integrating with the Extension

The parser logic was connected to a new VS Code command.

**Define Command in `package.json`:**

```json
"commands": [
    {
        "command": "js-dependency-graph.showGraph",
        "title": "Show Dependency Graph"
    }
]
```

**Define Activation Event in `package.json`:**

```json
"activationEvents": [
    "onCommand:js-dependency-graph.showGraph"
]
```

**Update `src/extension.ts`:**

* Registered the new command in the `activate` function.
* The command handler:

  * Displays an informational message: *Generating dependency graph...*
  * Calls the new `getDependencyGraph()` function.
  * Logs the resulting `graphData` JSON object to the Debug Console.
  * Displays a success message: *Dependency graph generated and logged to the debug console.*

---

### Step 2.4: Running and Testing

**Build** </br>
At project root:
```bash
cd webview
npm run build
```
```bash
cd..
npm run compile
```

**Run:** Press `F5` to start the Extension Development Host.

**Test:**

1. Open a JavaScript/TypeScript project in the new window.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Execute the command: **Show Dependency Graph**.
4. **Verify:** Check the Debug Console in the main VS Code window (where you are coding) to see the generated JSON output of the nodes and links.
