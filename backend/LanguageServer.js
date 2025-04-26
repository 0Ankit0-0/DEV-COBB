// const WebSocket = require("ws");
// const { spawn } = require("child_process");
// const path = require("path");
// const { languageServerConfig } = require("./config/LanguageServerconfig");

// const logger = {
//   info: (message) => console.log(`[LanguageServer] ${message}`),
//   error: (message, error) =>
//     console.error(`[LanguageServer ERROR] ${message}`, error),
// };

// function startLanguageServer(language) {
//   if (!languageServerConfig[language]) {
//     logger.error(`No language server configuration for ${language}`);
//     return null;
//   }

//   const config = languageServerConfig[language];

//   try {
//     let serverPath = config.serverPath;
//     if (serverPath.startsWith("node_modules/")) {
//       serverPath = path.resolve(process.cwd(), serverPath);
//     }

//     logger.info(`Starting language server for ${language} at ${serverPath}`);

//     const serverProcess = spawn(serverPath, config.args, {
//       ...config.options,
//       shell: process.platform === "win32", 
//       stdio: ["pipe", "pipe", "pipe"],
//     });

//     serverProcess.stdout.on("data", (data) => {
//       logger.info(`${language} server stdout: ${data}`);
//     });

//     serverProcess.stderr.on("data", (data) => {
//       const output = data.toString();
//       if (output.includes("error") || output.includes("Error")) {
//         logger.error(`${language} server stderr:`, output);
//       } else {
//         logger.info(`${language} server stderr: ${output}`);
//       }
//     });

//     serverProcess.on("error", (err) => {
//       logger.error(`Language server error for ${language}:`, err);
//     });

//     serverProcess.on("exit", (code) => {
//       logger.info(`Language server for ${language} exited with code ${code}`);
//     });

//     const cleanup = () => {
//       if (!serverProcess.killed) {
//         logger.info(`Terminating ${language} language server`);
//         serverProcess.kill();
//       }
//     };

//     process.on("exit", cleanup);
//     process.on("SIGINT", cleanup);
//     process.on("SIGTERM", cleanup);

//     return {
//       input: serverProcess.stdin,
//       output: serverProcess.stdout,
//       process: serverProcess,
//       cleanup,
//     };
//   } catch (err) {
//     logger.error(`Failed to start language server for ${language}:`, err);
//     return null;
//   }
// }

// function createLanguageServerWebSocket(server) {
//   const wss = new WebSocket.Server({
//     server,
//     path: "/language-server",
//   });

//   const runningServers = {};
//   let connectionCounter = 0;

//   wss.on("connection", (ws, req) => {
//     const connectionId = ++connectionCounter;
//     const urlParams = new URL(
//       req.url,
//       `http://${req.headers.host}`
//     ).pathname.split("/");
//     const language = urlParams[urlParams.length - 1];

//     logger.info(
//       `Client #${connectionId} connected to ${language} language server`
//     );

//     ws.isAlive = true;
//     ws.on("pong", () => {
//       ws.isAlive = true;
//     });

//     let languageServer = runningServers[language];
//     if (!languageServer) {
//       languageServer = startLanguageServer(language);
//       if (languageServer) {
//         runningServers[language] = languageServer;
//       } else {
//         ws.close(1011, `Could not start ${language} language server`);
//         return;
//       }
//     }

//     ws.on("message", (message) => {
//       try {
//         if (languageServer.input.writable) {
//           languageServer.input.write(message);
//           languageServer.input.write("\n");
//         } else {
//           logger.error(`Language server stdin for ${language} is not writable`);
//           ws.close(1011, "Language server input is not available");
//         }
//       } catch (err) {
//         logger.error(`Error writing to ${language} language server:`, err);
//         ws.close(
//           1011,
//           `Error communicating with language server: ${err.message}`
//         );
//       }
//     });

//     let outputBuffer = "";

//     languageServer.output.on("data", (data) => {
//       try {
//         if (ws.readyState === WebSocket.OPEN) {
//           outputBuffer += data.toString();

//           try {
//             const message = JSON.parse(outputBuffer);
//             ws.send(JSON.stringify(message));
//             outputBuffer = "";
//           } catch (parseError) {
//           }
//         }
//       } catch (err) {
//         logger.error(`Error sending data to client:`, err);
//       }
//     });

//     ws.on("close", (code, reason) => {
//       logger.info(
//         `Client #${connectionId} disconnected from ${language} language server: ${code} ${reason}`
//       );
//     });

//     ws.on("error", (error) => {
//       logger.error(`WebSocket error for ${language}:`, error);
//     });
//   });

//   const pingInterval = setInterval(() => {
//     wss.clients.forEach((ws) => {
//       if (ws.isAlive === false) {
//         logger.info("Terminating inactive WebSocket connection");
//         return ws.terminate();
//       }

//       ws.isAlive = false;
//       ws.ping(() => {});
//     });
//   }, 30000);

//   wss.on("close", () => {
//     clearInterval(pingInterval);

//     Object.entries(runningServers).forEach(([language, server]) => {
//       if (server && server.cleanup) {
//         server.cleanup();
//       }
//     });
//   });

//   wss.on("error", (err) => {
//     logger.error("WebSocket server error:", err);
//   });

//   return wss;
// }

// module.exports = { createLanguageServerWebSocket };
