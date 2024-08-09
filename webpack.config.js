const path = require("path");
const fs = require('fs');

module.exports = {
    entry: "./agoraLogic.js",
    output: {
        filename: "bundledAgoraLogic.js",
        path: path.resolve(__dirname, "./dist"),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, './'), 
        },
        compress: true,
        port: 443, // Порт для HTTPS
        host: '0.0.0.0', // Позволяет доступ из сети
        allowedHosts: 'all', // Разрешает запросы с любого хоста
        server: {
            type: 'https',
            options: {
                key: fs.readFileSync(path.join(__dirname, 'sertificate/server.key')),
                cert: fs.readFileSync(path.join(__dirname, 'sertificate/server.cert')),
            },
        },
    },
};
