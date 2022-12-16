import * as vscode from 'vscode';
import { MymsgView } from './MymsgView'
import { IPMsg } from './ipmsg/IPMsg'

export function activate(context: vscode.ExtensionContext) {
	const myCommandId = 'codemsg.open';
	let disposable = vscode.commands.registerCommand(myCommandId, () => {
		MymsgView.createOrShow(context);
	});

	context.subscriptions.push(disposable);

	// create a new status bar item that we can now manage
	let myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.text = `$(comment-discussion) CodeMsg`;

	myStatusBarItem.show();
}

export function deactivate() {
	console.log("codemsg quit");
	IPMsg.instance().exit();
}
