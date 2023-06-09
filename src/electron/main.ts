import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs';
import log from 'electron-log';
import isDev from 'electron-is-dev';
// 起動 --------------------------------------------------------------

let mainWindow: BrowserWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nativeWindowOpen: true,
    },
  });
  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);
  // mainWindow.webContents.openDevTools();
  await mainWindow.loadFile('index.html');
}

app.whenReady().then(async () => {
  await createWindow();

  if (!isDev) {
    // 起動時に1回だけ
    log.info(`アップデートがあるか確認します。${app.name} ${app.getVersion()}`);

    await autoUpdater.checkForUpdates();
  }
});

// アップデート --------------------------------------------------
autoUpdater.on(
  'update-downloaded',
  async (event, releaseNotes, releaseName) => {
    log.info('アップデートを開始します。');

    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    };

    await dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  }
);

autoUpdater.on('error', (message) => {
  log.warn('There was a problem updating the application');
  log.warn(message);
});

// Angular -> Electron --------------------------------------------------
// ファイルを開く
ipcMain.on('open', (event: Electron.IpcMainEvent) => {
  // ファイルを選択
  const paths = dialog.showOpenDialogSync(mainWindow, {
    buttonLabel: 'open', // 確認ボタンのラベル
    filters: [{ name: 'json', extensions: ['json'] }],
    properties: [
      'openFile', // ファイルの選択を許可
      'createDirectory', // ディレクトリの作成を許可 (macOS)
    ],
  });

  // キャンセルで閉じた場合
  if (paths === undefined) {
    event.returnValue = { status: undefined };
    return;
  }

  // ファイルの内容を返却
  try {
    const path = paths[0];
    const buff = fs.readFileSync(path);

    // ファイルを読み込む
    event.returnValue = {
      status: true,
      path: path,
      text: buff.toString(),
    };
  } catch (error) {
    event.returnValue = { status: false, message: error.message };
  }
});

// 上書き保存
ipcMain.on(
  'overWrite',
  async (event: Electron.IpcMainEvent, path: string, data: string) => {
    fs.writeFile(path, data, async function (error) {
      if (error != null) {
        await dialog.showMessageBox({ message: 'error : ' + error });
      }
    });
    event.returnValue = path;
  }
);

// 名前を付けて保存
ipcMain.on(
  'saveFile',
  async (event: Electron.IpcMainEvent, filename: string, data: string, ext: string) => {
    // 場所とファイル名を選択
    const path = dialog.showSaveDialogSync(mainWindow, {
      buttonLabel: 'save', // ボタンのラベル
      filters: [{ name: ext, extensions: [ext] }],
      defaultPath: filename,
      properties: [
        'createDirectory', // ディレクトリの作成を許可 (macOS)
      ],
    });

    // キャンセルで閉じた場合
    if (path === undefined) {
      event.returnValue = '';
    }

    // ファイルの内容を返却
    try {
      fs.writeFileSync(path, data);
      event.returnValue = path;
    } catch (error) {
      await dialog.showMessageBox({ message: 'error : ' + error });
      event.returnValue = '';
    }
  }
);

// アラートを表示する
ipcMain.on(
  'alert',
  async (event: Electron.IpcMainEvent, message: string) => {
    await dialog.showMessageBox({ message });
    event.returnValue = '';
  }
);
