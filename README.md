# Git Comment Commit

Git Comment Commit allows users to specify file specific commits using comment

> This extension only manages to add and commit files but not push

## How to use?

> Use `commit: commit message` syntax in a commentable language or just save the file to switch input mode.

- This extension will only run when a existing Git repository found

![How to use? - Comment Mode](https://github.com/iPatavatsizz/git-comment-commit/blob/dev/images/extension-commentmode.png?raw=true)
![How to use? - Input Mode](https://github.com/iPatavatsizz/git-comment-commit/blob/dev/images/extension-inputmode.png?raw=true)

## Features

- Auto comment save to fast commit
- Two different commit modes, Input&Comment

## Extension Settings

This extension contributes the following settings:

- `git-comment-commit.showGitRepo`: `true` - Show a git notification if exists
- `git-comment-commit.useLastComment`: `true` - Use last comment for input mode

> Changes may require restart to apply

## Known Issues

If you have encountered any issues/bugs or anything, please report us [issues](https://github.com/iPatavatsizz/git-comment-commit/issues)

There are currently no issues related to working properly.

## Release Notes

- For seeing upcoming and planned features, please refer to [dev channel](https://github.com/iPatavatsizz/git-comment-commit/tree/dev)

### 2.1.1 (d)

- Extension icons changed

### 2.1.0 (r)

- Extension can now find comment anywhere
- (Semantic Versioning rules followed)

### 2.0.0 (r)

- Settings interactions implemented
- Added auto comment saving per file
- Switched from `vscode.window.showInformationMessage` to `vscode.window.withProgress` for better notification
- Extension has rewritten in terms of beauty and clean code

### 1.0.0 (r)

Initial release of git-comment-commit extension with following features.

- Input Mode commitment
- Comment Mode commitment

---

**Enjoy!**
