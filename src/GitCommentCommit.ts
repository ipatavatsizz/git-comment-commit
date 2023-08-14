import simpleGit, { CommitResult, SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { ExtensionStorage } from './GitExtensionStorage';

export class GitCommentCommit {
  storage: ExtensionStorage;
  git: SimpleGit | undefined;
  document: vscode.TextDocument | undefined;
  context: vscode.ExtensionContext;
  workspace: vscode.WorkspaceFolder | undefined;
  editor: vscode.TextEditor | undefined;
  isCommitting: boolean = false;
  console: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.storage = new ExtensionStorage(context);
    this.editor = vscode.window.activeTextEditor;
    this.document = this.editor?.document;
    this.console = vscode.window.createOutputChannel(
      this.context.extension.packageJSON.displayName
    );

    this.context.subscriptions.push(this.onDidChangeActiveTextEditor);
    this.context.subscriptions.push(this.onWillSaveTextDocument);
  }

  onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      this.editor = editor;
      this.document = editor?.document;
    }
  );
  onWillSaveTextDocument = vscode.workspace.onWillSaveTextDocument(
    async (event) => {
      this.document = event.document;
      if (this.isCommitting) {
        vscode.window.showErrorMessage(
          'There is currently active process! Please wait soon.'
        );
      } else {
        await this.analyze();
      }
    }
  );

  async init(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      this.workspace = workspaceFolders.at(0);
      this.git = simpleGit(this.workspace!.uri.fsPath);
      let init = await this.git.init();
      vscode.window.showInformationMessage(`Git: ${init.gitDir}`);
    }
  }
  async analyze(): Promise<void> {
    let comment = await this.getComment();
    if (comment) {
      await this.commentMode();
    } else {
      await this.inputMode();
    }
  }
  async commentMode(): Promise<void> {
    let comment = await this.getComment();
    await this.commit(comment!);
  }
  async inputMode(): Promise<void> {
    let comment = await vscode.window.showInputBox({
      placeHolder: 'Comment to commit',
    });

    if (comment) {
      await this.commit(comment);
    }
  }
  async commit(message: string | 'Uncommitted changes'): Promise<void> {
    await vscode.window.withProgress<void>(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
        title: 'Starting committing active file',
      },
      async (progress, token) => {
        return new Promise<void>(async (resolve, reject) => {
          token.onCancellationRequested(() => {
            this.console.appendLine(`Commit process cancelled at ${stage}/3`);
            progress.report({ message: 'Progress cancelled.' });
            setTimeout(() => {
              return reject();
            }, 2000);
          });

          this.isCommitting = true;
          let commit: CommitResult;
          let stage: number = 0;

          setTimeout(async () => {
            stage++;
            progress.report({
              increment: 30,
              message: `Adding file - ${stage}/3`,
            });
            await this.git!.add(this.document!.uri.fsPath!, (error, result) => {
              if (error) {
                console.error(error);
                this.console.appendLine(error.message);
                progress.report({
                  message: `Could not git.add successfully.\nCheck the details in extension logs.`,
                });
                setTimeout(() => {
                  return reject();
                }, 2000);
              }
            });
          }, 1000);

          setTimeout(async () => {
            stage++;
            progress.report({
              increment: 60,
              message: `Committing file - ${stage}/3`,
            });
            commit = await this.git!.commit(
              message,
              this.document!.uri.fsPath,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              { '--amend': null },
              async (error, result) => {
                if (error) {
                  console.error(error);
                  this.console.appendLine(error.message);
                  progress.report({
                    message: `An unexpected error occured at git.commit.\nCheck the details in extension logs.`,
                  });
                  setTimeout(() => {
                    reject();
                  }, 2000);
                }
              }
            );
          }, 2000);

          setTimeout(async () => {
            if (commit) {
              console.dir(commit);
              stage++;
              progress.report({
                increment: 100,
                message: `File successfully committed to ${
                  commit.branch ? commit.branch : 'commit.branch'
                } #${commit.commit ? commit.commit : 'commit.id'} - ${stage}/3`,
              });
            }
            this.isCommitting = false;
            setTimeout(() => {
              return resolve();
            }, 1500);
          }, 3000);
        });
      }
    );
  }
  async getComment(): Promise<string | undefined> {
    if (this.document) {
      let match = this.document
        .lineAt(0)
        .text.match(/^\/\/\s*commit:\s*(.*)$/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    return undefined;
  }
}

// let saveLastComment = async (path: string, comment: string) => {
//   await context.globalState.update(path, comment);
// };

// let getLastComment = async (path: string): Promise<string> => {
//   let comment = await context.globalState.get<string>(path);
//   if (comment) {
//     return comment;
//   }
//   return '';
// };
