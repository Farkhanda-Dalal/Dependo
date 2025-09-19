import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

// This require statement bundles the server code into the extension
require('./server'); 

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('js-dependency-graph.showGraph', async () => {
        const port = 3001;
        
        // This is a more robust way to check if the server is running
        const maxAttempts = 10;
        let attempts = 0;

        const checkServer = () => {
            if (attempts < maxAttempts) {
                attempts++;
                fetch(`http://localhost:${port}/api/graph`)
                    .then(response => {
                        if (response.ok) {
                            console.log('Server is up and running!');
                            vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
                        } else {
                            setTimeout(checkServer, 500);
                        }
                    })
                    .catch(() => {
                        setTimeout(checkServer, 500);
                    });
            } else {
                vscode.window.showErrorMessage('Failed to connect to the local server after multiple attempts.');
            }
        };
        checkServer();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}