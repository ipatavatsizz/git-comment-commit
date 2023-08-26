//TODO: Trigger commit process when file is modified!

import simpleGit, { CommitResult, SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { ExtensionSettings } from './GitExtensionSettings';
import { ExtensionStorage } from './GitExtensionStorage';
import { ExtensionUtils } from './utils';
export class GitCommentCommit {
  storage: ExtensionStorage;
  git: SimpleGit | undefined;
  document: vscode.TextDocument | undefined;
  context: vscode.ExtensionContext;
  workspace: vscode.WorkspaceFolder | undefined;
  editor: vscode.TextEditor | undefined;
  isCommitting: boolean = false;
  console: vscode.OutputChannel;
  active: boolean = false;

  async deactivate() {
    this.active = false;
    this.context.subscriptions.forEach((sub) => sub.dispose());
    let message = `${this.context.subscriptions.length} subscriptions deleted, extension is now deactivated.`;
    this.context.subscriptions.length = 0;
    vscode.window.showInformationMessage('GitCommentCommit is now deactivated.');

    console.info(message);
    this.console.appendLine(message);
  }
  async activate() {
    if (await ExtensionUtils.isBrowser()) {
      vscode.window.showInformationMessage('We are truly sorry! This extension cannot work on web.');
      return;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      this.active = true;
      this.workspace = workspaceFolders.at(0);
      this.git = simpleGit(this.workspace!.uri.fsPath);
      let init = await this.git.init();

      if (ExtensionSettings.showGitRepo) {
        vscode.window.showInformationMessage(`Git: ${init.gitDir}`);
      }

      let message = `${this.context.subscriptions.length} subscriptions registered, extension is now activated.`;
      this.console.appendLine(message);
      console.log(message);
    }
  }

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.storage = new ExtensionStorage(context);
    this.editor = vscode.window.activeTextEditor;
    this.document = this.editor?.document;
    this.console = vscode.window.createOutputChannel(this.context.extension.packageJSON.displayName);

    this.context.subscriptions.push(this.onDidChangeActiveTextEditor);
    this.context.subscriptions.push(this.onWillSaveTextDocument);

    this.activate();
  }

  onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    this.editor = editor;
    this.document = editor?.document;
  });
  onWillSaveTextDocument = vscode.workspace.onWillSaveTextDocument(async (event) => {
    this.document = event.document;
    if (this.isCommitting) {
      vscode.window.showErrorMessage('There is currently active process! Please wait soon.');
      return;
    } else if (!event.document.isDirty) {
      this.console.appendLine('Skipping commit process because the active file is not modified.');
      return;
    } else {
      if (await this.isWorkspaceFile(this.document?.uri!)) {
        await this.analyze();
        return;
      }
      this.console.appendLine(`The file does not inside workspace. Skipping process`);
    }
  });

  async isWorkspaceFile(uri: vscode.Uri): Promise<boolean> {
    let getFiles = await vscode.workspace.findFiles('**/*.*', undefined, undefined, undefined);
    if (getFiles.find((file) => file.fsPath === uri.fsPath)) {
      return true;
    }
    return false;
  }

  async analyze(): Promise<void> {
    let comment = await this.getComment(false);
    if (comment) {
      await this.commentMode();
    } else {
      await this.inputMode();
    }
  }
  async commentMode(): Promise<void> {
    let comment = await this.getComment();
    if (comment) {
      await this.commit(comment!);
    }
  }
  async inputMode(): Promise<void> {
    let comment = await vscode.window.showInputBox({
      placeHolder: 'Comment to commit',
      value: ExtensionSettings.useLastComment ? await this.getComment() : `Update ${this.document?.fileName}`,
    });

    if (comment) {
      await this.commit(comment);
    }
  }
  async commit(message: string): Promise<void> {
    await vscode.window.withProgress<void>(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
        title: 'Starting committing active file',
      },
      async (progress, token) => {
        return new Promise<void>(async (resolve, reject) => {
          if (ExtensionSettings.useLastComment) {
            await this.saveComment(message);
          }

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
          }, 500);

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
                    message: `Could not commit successfully.\nCheck the details in extension logs.`,
                  });
                  setTimeout(() => {
                    reject();
                  }, 2000);
                }
              }
            );
          }, 1500);

          setTimeout(async () => {
            if (commit) {
              stage++;
              progress.report({
                increment: 100,
                message: `Successfully committed to ${commit.branch ? commit.branch : 'commit.branch'} #${
                  commit.commit ? commit.commit : 'commit.id'
                } - ${stage}/3`,
              });
            }
            this.isCommitting = false;
            setTimeout(() => {
              return resolve();
            }, 1500);
          }, 2500);
        });
      }
    );
  }
  async getComment(useLastComment = true, fullComment = false): Promise<string | undefined> {
    if (this.document) {
      for (let index = 0; index < this.document.lineCount; index++) {
        const line = this.document.lineAt(index);
        let match = line.text.match(/\s*commit:\s*(.*)$/i);

        if (match && match[1]) {
          if (fullComment) {
            return match[0];
          }
          return match[1];
        } else {
          if (useLastComment) {
            if (fullComment) {
              return `// commit: ${await this.context.globalState.get(this.document.uri.fsPath)}`;
            }
            return await this.context.globalState.get(this.document.uri.fsPath);
          }
        }
      }
      return undefined;
    }
  }
  async saveComment(comment: string) {
    await this.context.globalState.update(this.document?.uri.fsPath!, comment);
  }
}
