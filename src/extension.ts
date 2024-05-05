import * as vscode from 'vscode';
import { ParquetDocumentProvider } from './parquetDocument';

export function activate(context: vscode.ExtensionContext) {
    // Register our custom editor providers
    context.subscriptions.push(ParquetDocumentProvider.register(context));
}
