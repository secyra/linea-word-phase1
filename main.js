// main.js (Electron Main Process)

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import mammoth from 'mammoth'; // DOCX -> HTML conversion
import htmlToDocx from 'html-to-docx'; // HTML -> DOCX conversion (using docx library)

// --- Define __dirname and __filename equivalents for ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL for your Vite dev server
const VITE_DEV_SERVER_URL = 'http://localhost:8080';

// --- Convert HTML to DOCX Buffer ---
const convertHtmlToDocxBuffer = async (htmlContent) => {
  // html-to-docx handles tables, images, bold, italics, etc.
  const buffer = await htmlToDocx(htmlContent, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: false,
  });

  return buffer;
};

// --- IPC: Open DOCX File and convert to HTML ---
ipcMain.handle('dialog:openFile', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Word Documents', extensions: ['docx', 'doc'] }],
    });

    if (canceled || filePaths.length === 0) return { canceled: true };

    const filePath = filePaths[0];
    const fileBuffer = await fs.readFile(filePath);
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    const htmlContent = result.value;

    return {
      filePath,
      htmlContent,
    };
  } catch (error) {
    console.error('Error in dialog:openFile handler:', error);
    return { error: `File processing failed: ${error.message}` };
  }
});

// --- IPC: Save HTML content as DOCX file ---
ipcMain.handle('dialog:saveFile', async (event, defaultFilename, content) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultFilename.replace(/\.html$/i, '.docx'),
      filters: [
        { name: 'Word Document', extensions: ['docx'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return { canceled: true };

    // Convert the HTML content to a DOCX buffer
    const docxBuffer = await convertHtmlToDocxBuffer(content);

    // Save the DOCX file
    await fs.writeFile(filePath, docxBuffer);

    return { success: true, filePath };
  } catch (error) {
    console.error('Error in dialog:saveFile handler:', error);
    return { error: `File saving failed: ${error.message}` };
  }
});

// --- Create the Electron Browser Window ---
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenu(null); // 👈 permanently removes the menu
  //mainWindow.loadURL(VITE_DEV_SERVER_URL);

 if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:8080"); // Vite dev server

  } else {
    mainWindow.loadFile(path.join(__dirname, "build", "index.html")); // production build

  }

  // 🔥 FIX: Ensure window receives keyboard focus
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.focus();
  });
  
  // 🔑 Automatically open DevTools
  //mainWindow.webContents.openDevTools();

  

};

// --- App lifecycle ---
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
