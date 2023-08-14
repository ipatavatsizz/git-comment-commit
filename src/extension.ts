// commit: this commit shows git-comment-commit extension is working!
// TODO: save last comment for input save for fast committing.

import * as vscode from 'vscode';
import { GitCommentCommit } from './GitCommentCommit';

export async function activate(context: vscode.ExtensionContext) {
  let extension = new GitCommentCommit(context);
  extension.init();
}

export function deactivate() {}
