import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { IPMsg } from './ipmsg/IPMsg'
import { handleMessage } from './MessageHandler';

export class MymsgView {
  	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static myView: MymsgView | undefined;
  public static readonly viewType = 'myMsg';

	private readonly _webviewPanel: vscode.WebviewPanel;
	private _disposed = false;

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (MymsgView.myView && !MymsgView.myView._disposed) {
			MymsgView.myView._webviewPanel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const webviewPanel = vscode.window.createWebviewPanel(
			MymsgView.viewType,
			'CodeMsg',
			column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
		);

		let logoPath = path.join(context.extensionPath, 'media', 'logo.png');
		webviewPanel.iconPath = vscode.Uri.file(logoPath);

		MymsgView.myView = new MymsgView(webviewPanel, context);
  }

  public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
		MymsgView.myView = new MymsgView(panel, context);
	}

  private constructor(webviewPanel: vscode.WebviewPanel, private readonly context: vscode.ExtensionContext) {
    this._webviewPanel = webviewPanel;
    let htmlPath = path.join(this.context.extensionPath, 'web', 'dist', 'index.html');
    webviewPanel.webview.html = this.getHtml4Path(webviewPanel.webview, htmlPath);

    IPMsg.instanceWithWebview(webviewPanel.webview).start();

		let logDBs = this.getLogDBs();

		let me = this;
    vscode.window.onDidChangeActiveColorTheme((e) => {
			me.setActiveTheme();
    });

		// let saveLog = setInterval(saveChatLog, 5000); 
    // Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			console.log("webviewPanel.onDidDispose");
			this._disposed = true;
			// clearInterval(saveLog);
			IPMsg.instance().exit();
			// IPMsg.instance().stop();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			handleMessage(e, webviewPanel.webview, webviewPanel, logDBs);
		});

		// this.testNedb();
		// this.testSqlite3();
		this.updateWebview();      
		
		console.log("locale", vscode.env.language);
  }

	private setActiveTheme() {
		let webviewPanel = this._webviewPanel;
		let kind = vscode.window.activeColorTheme.kind;
		webviewPanel.webview.postMessage({
			type: 'setTheme',
			kind: kind
		});	
	}

	private getIPs() : any {
		let list = [];
		var interfaces = os.networkInterfaces();
		for (var devName in interfaces) {
		  let iface = interfaces[devName];
		  if(iface !== undefined) { 
				for (var i = 0; i < iface.length; i++) {
					var alias = iface[i];
					console.log("network interface", devName);
					if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
						let address = alias.address;
						list.push({
							name: devName,
							address: address
						})
					}
				}
		  }
		}
		return list;
	}

	private setIPList() {
		let list = this.getIPs();
		let webviewPanel = this._webviewPanel;
		let defaultIP = "";
		for(let obj of list) {
			let name = obj.name;
			if(name.indexOf("VMWare") == -1 && name.indexOf("Virtual") == -1 && name.indexOf("Hyper") == -1) {
				defaultIP = obj.address;
			}
		}
		IPMsg.instance().setDefautIP(defaultIP);
		
		webviewPanel.webview.postMessage({
			type: 'setIPList',
			defaultIP: defaultIP,
			ipList: list 
		});	
	}

	private updateWebview() {
		let webviewPanel = this._webviewPanel;
		const mode = vscode.workspace.getConfiguration().get('codemsg.mode');
		const nickname = vscode.workspace.getConfiguration().get('codemsg.nickname');
		const group = vscode.workspace.getConfiguration().get('codemsg.group');
		const filelocation = vscode.workspace.getConfiguration().get('codemsg.filelocation');
		const networkList = vscode.workspace.getConfiguration().get('codemsg.networkList');
		const favoriteList = vscode.workspace.getConfiguration().get('codemsg.favoriteList');
		const useVscodeMsg = vscode.workspace.getConfiguration().get('codemsg.useVscodeMsg');
		const hisdays = vscode.workspace.getConfiguration().get('codemsg.hisdays');
		const encryption = vscode.workspace.getConfiguration().get('codemsg.encryption');
		let rootPath = path.join(this.context.extensionPath, "web", "dist");
		let furi = vscode.Uri.file(rootPath);


		// let distUri = vscode.Uri.joinPath(this.context.extensionUri, 'web', 'dist');
		// console.log("distUri", distUri);
		const uriRoot = webviewPanel.webview.asWebviewUri(furi).toString();
		console.log("uriRoot", uriRoot);

		webviewPanel.webview.postMessage({
			type: 'locale',
			locale: vscode.env.language
		})
		webviewPanel.webview.postMessage({
			type: 'setting',
			mode: mode,
			nickname: nickname,
			group: group,
			filelocation: filelocation
		});
		webviewPanel.webview.postMessage({
			type: 'setNetworkList',
			networkList: networkList
		});
		webviewPanel.webview.postMessage({
			type: 'setFavoriteList',
			favoriteList: favoriteList
		});
		webviewPanel.webview.postMessage({
			type: 'setUseVscodeMsg',
			useVscodeMsg: useVscodeMsg
		});
		webviewPanel.webview.postMessage({
			type: 'setHisdays',
			hisdays: hisdays
		});
		webviewPanel.webview.postMessage({
			type: 'setEncryption',
			encryption: encryption
		});
		// console.log("this.context.extensionUri", this.context.extensionUri);

		webviewPanel.webview.postMessage({
			type: "setUriRoot",
			uriRoot: uriRoot
		})
		this.setActiveTheme();
		this.setIPList();
	}

	private getLogDBs() : any {
		const myhome = vscode.workspace.getConfiguration().get('codemsg.filelocation');
		let homedir = path.join(os.homedir(), ".codemsg");
		if(typeof myhome === "string") {
			if(myhome.trim() !== "") {
				homedir = myhome.trim();
			}
		}
		try {
			fs.accessSync(homedir, fs.constants.F_OK);
		} catch(err) {
			fs.mkdirSync(homedir);
		} 
		let logdir = path.join(homedir, "log");
		try {
			fs.accessSync(logdir, fs.constants.F_OK);
		} catch(err) {
			fs.mkdirSync(logdir);
		}   
		const myHisdays = vscode.workspace.getConfiguration().get('codemsg.hisdays');
		let hisdays = 1;
		if(typeof myHisdays === "number") {
			hisdays = myHisdays;
		}
		const nedb = require('nedb');
		let now = new Date();
		let todayFile = path.join(logdir, this.formatDate(now, "yyyyMMdd")+".logdb"); 
		let todayDB = new nedb({
			filename: todayFile,
			autoload: true
		})
		let hisDBs = [];
		let oneday = 1000 * 60 * 60 * 24;
		for(let i=0; i<hisdays; i++) {
			let hisDate = new Date(now.getTime() - (i+1) * oneday);
			let hisFile = path.join(logdir, this.formatDate(hisDate, "yyyyMMdd")+".logdb");
			try {
				fs.accessSync(hisFile, fs.constants.F_OK);				
			} catch(err) {
				continue;
			} 
			let hisDB = new nedb({
				filename: hisFile,
				autoload: true
			});
			hisDBs.push(hisDB);
		}
		return {
			today: todayDB,
			history: hisDBs
		};
	}

	private loadDB() {
		let webviewPanel = this._webviewPanel;
		const nedb = require('nedb');
		// db.find({}, function (err:any, docs:any) {
		// 	for(let item of docs) {
		// 		webviewPanel.webview.postMessage({
		// 			type: 'loadlog',
		// 			content: item
		// 		});
		// 	}
		// });

	}

	private formatDate(date: Date, fmt:string) { //author: meizz 
		let o: any = {
				"M+": date.getMonth() + 1, //月份 
				"d+": date.getDate(), //日 
				"H+": date.getHours(), //小时 
				"m+": date.getMinutes(), //分 
				"s+": date.getSeconds(), //秒 
				"q+": Math.floor((date.getMonth() + 3) / 3), //季度 
				"S": date.getMilliseconds() //毫秒 
		};
		if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
		for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		return fmt;
	}

	private getHtml4Path(webview: vscode.Webview, htmlPath: string) {
    // 兼容`v1.38+`
    // `vscode-resource`无法加载？用`vscode-webview-resource`替换，未在文档上查到`vscode-webview-resource`，根据`panel.webview.asWebviewUri(htmlPath)`获得
    const scheme = webview.cspSource ? webview.cspSource.split(':')[0] : 'vscode-resource';
    const dirPath = path.dirname(htmlPath);
    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = html.replace(/(href=|src=)(.+?)(\ |>)/g, (m, $1, $2, $3) => {
        let uri = $2;
        uri = uri.replace('"', '').replace("'", '');
        uri.indexOf('/static') === 0 && (uri = `.${uri}`);
        if (uri.substring(0, 1) == ".") {
            const furi = vscode.Uri.file(path.resolve(dirPath, uri));
            if (webview.asWebviewUri) {
                uri = `${$1}${webview.asWebviewUri(furi)}${$3}`;
            } else {
                uri = `${$1}${furi.with({ scheme }).toString()}${$3}`;
            }
            return uri.replace('%22', '');
        }
        return m;
    });
    return html;
  }
}