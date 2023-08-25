import * as vscode from 'vscode';
import { GitCommentCommit } from './GitCommentCommit';

let extension: GitCommentCommit | undefined;
export async function activate(context: vscode.ExtensionContext) {
  extension = new GitCommentCommit(context);
}

export async function deactivate(context: vscode.ExtensionContext) {
  await extension?.deactivate();
}
