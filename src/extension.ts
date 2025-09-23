// extension.ts
import * as vscode from 'vscode';

// This require statement bundles the server code into the extension
require('./server'); 

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('js-dependency-graph.showGraph', async () => {
        const port = 3001;

        // Wrap the entire process in a VS Code progress notification.
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing project dependencies...",
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Starting local server...' });

            const maxAttempts = 10;
            let attempts = 0;

            const checkServer = () => {
                return new Promise<void>((resolve, reject) => {
                    const check = () => {
                        if (attempts < maxAttempts) {
                            attempts++;
                            fetch(`http://localhost:${port}/api/graph`)
                                .then(response => {
                                    if (response.ok) {
                                        console.log('Server is up and running!');
                                        resolve();
                                    } else {
                                        progress.report({ message: `Waiting for server to respond... (${attempts}/${maxAttempts})` });
                                        setTimeout(check, 500);
                                    }
                                })
                                .catch(() => {
                                    progress.report({ message: `Waiting for server to start... (${attempts}/${maxAttempts})` });
                                    setTimeout(check, 500);
                                });
                        } else {
                            reject('Failed to connect to the local server after multiple attempts.');
                        }
                    };
                    check();
                });
            };

            try {
                await checkServer();
                progress.report({ message: 'Opening dependency graph in browser...' });
                vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}`));
            } catch (error) {
                vscode.window.showErrorMessage(String(error));
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}