import * as vscode from 'vscode';

export class ExtensionSettings {
  static readonly configuration =
    vscode.workspace.getConfiguration('git-comment-commit');

  static readonly showGitRepo = this.configuration.get<boolean>('showGitRepo');
  static readonly useLastComment = this.configuration.get<boolean>('useLastComment');
}
