const { app, BrowserWindow, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

const SITE_URL = "https://blockwissen-minecraft.antlon.workers.dev/";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#101910",
    title: "Blockwissen Minecraft",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(SITE_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.checkForUpdatesAndNotify().catch(error => {
      console.error("Update-Prüfung fehlgeschlagen:", error);
    });
  }
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("update-downloaded", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Update bereit",
    message: "Ein Update für Blockwissen Minecraft wurde heruntergeladen.",
    detail: "Die App wird neu gestartet, um das Update zu installieren.",
    buttons: ["Jetzt neu starten", "Später"]
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});
