const { app, Menu, BrowserWindow, dialog, nativeImage } = require('electron');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  const iconPath = process.platform === "darwin"
    ? path.join(__dirname, "build/icons/icon.icns")
    : process.platform === "win32"
      ? path.join(__dirname, "build/icons/icon.ico")
      : path.join(__dirname, "build/icons/icon.png");

  console.log("Icon Path:", iconPath); // DEBUG: Print icon path to console
  const icon = nativeImage.createFromPath(iconPath);
  console.log("Icon isEmpty:", icon.isEmpty()); // DEBUG: Check if icon is loaded

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: icon,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
});
app.setName("psychoSounds");
