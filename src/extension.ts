import * as vscode from 'vscode';
import { ParquetDocumentProvider } from './parquetDocument';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(ParquetDocumentProvider.register(context, 'parquetExplorer.explorer'));
    context.subscriptions.push(ParquetDocumentProvider.register(context, 'parquetExplorer.explorer.optional'));
}
