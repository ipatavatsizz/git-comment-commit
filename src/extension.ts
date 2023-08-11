import * as vscode from 'vscode';
import * as git from './api/git';

enum Commands {
  commentCommit = 'git-comment-commit.gitCommentCommit',
}

export function activate(context: vscode.ExtensionContext) {
  let api = vscode.extensions
    .getExtension<git.GitExtension>('vscode.git')
    ?.exports.getAPI(1);
  if (api?.state === 'initialized') {
    console.dir(api.repositories);
  }

  let commitButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -100
  );
  commitButton.command = Commands.commentCommit;
  commitButton.tooltip = 'Git Commit Comments';
  commitButton.text = 'Comment Commit';
  commitButton.show();
  context.subscriptions.push(commitButton);

  context.subscriptions.push(
    vscode.commands.registerCommand(Commands.commentCommit, commentCommit)
  );
}

let commentCommit = async () => {
  vscode.window.showInformationMessage('gitCommentCommit!');
};

export function deactivate() {}
