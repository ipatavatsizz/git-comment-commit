// commit: this commit shows git-comment-commit extension is working!
// TODO: save last comment for input save for fast committing.

import * as simpleGit from 'simple-git';
import * as vscode from 'vscode';

let git: simpleGit.SimpleGit;
let vsConsole = vscode.window.createOutputChannel('Git-Comment-Commit');

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders) {
    git = simpleGit.simpleGit(workspaceFolders[0].uri.fsPath);
    let init = await git.init();
    console.log(init.gitDir);

    vscode.window.showInformationMessage(`GitHub Repository: ${init.gitDir}`);
    context.subscriptions.push(onWillSaveDocument);
  }
}

export function deactivate() {}

let onWillSaveDocument = vscode.workspace.onWillSaveTextDocument(
  async (event) => {
    let comment = await findComment(event);
    if (comment) {
      await commentCommit(event, comment);
    } else {
      await inputCommit(event);
    }
  }
);

let findComment = async (
  event: vscode.TextDocumentWillSaveEvent
): Promise<string | null> => {
  let match = event.document.lineAt(0).text.match(/^\/\/\s*commit:\s*(.*)$/i);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

let inputCommit = async (event: vscode.TextDocumentWillSaveEvent) => {
  let comment = await vscode.window.showInputBox({
    placeHolder: 'Comment to commit',
  });

  if (comment) {
    await commitProgress(event, comment);
  }
};

let commentCommit = async (
  event: vscode.TextDocumentWillSaveEvent,
  comment: string
) => {
  await commitProgress(event, comment);
};

let commitProgress = async (
  event: vscode.TextDocumentWillSaveEvent,
  comment: string
) => {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: 'Committing comment',
    },
    async (progress, token) => {
      return new Promise<void>(async (resolve, reject) => {
        setTimeout(async () => {
          progress.report({ message: 'Adding file', increment: 30 });
          await git.add(event.document.uri.fsPath);
        }, 1500);

        setTimeout(() => {
          progress.report({ message: 'Committing comment', increment: 60 });
        }, 3000);

        let response = await git.commit(
          comment.length > 0 ? comment : 'Uncommitted changes'
        );

        if (response) {
          setTimeout(() => {
            progress.report({
              message: `Successfully committed to ${response.branch} #${response.commit}`,
              increment: 100,
            });
          }, 3000);

          setTimeout(() => {
            resolve();
          }, 5000);
        } else {
          setTimeout(() => {
            reject();
            progress.report({
              message: `Couldn't commit changes. \nFor more information see extension output.`,
            });
          }, 3000);
          vsConsole.appendLine(
            'This error can be occured from git.add or git.commit methods. The reason can be authentication, initialization or unknown problems.'
          );
        }
      });
    }
  );
};
