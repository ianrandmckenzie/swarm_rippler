const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.name = 'psychSounds';

const iconPngPath = path.resolve(__dirname, "build/icons/icon.png");
const iconPath = process.platform === "darwin"
? path.resolve(__dirname, "build/icons/icon.icns")
: process.platform === "win32"
  ? path.resolve(__dirname, "build/icons/icon.ico")
  : iconPngPath;


app.whenReady().then(() => {
  app.dock.setIcon(iconPngPath);
  createWindow();
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  app.setName("psychoSounds");
};
