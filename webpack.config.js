const path = require("path");
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: "./agoraLogic.js",
    output: {
        filename: "bundledAgoraLogic.js",
        path: path.resolve(__dirname, "./dist"),
        clean: true,
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        cacheDirectory: true,
                    },
                },
            },
            {
                test: /\.css$/,
                include: path.resolve(__dirname, 'style'),
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
        ],
    },
    plugins: [
     new MiniCssExtractPlugin({
           filename: 'style.css',
        }),
        new HtmlWebpackPlugin({
             template: './index.html',
           filename: 'index.html',
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, './'),
        },
        compress: true,
        port: 443,
        host: '0.0.0.0',
        allowedHosts: 'all',
        server: {
            type: 'https',
            options: {
                key: fs.readFileSync(path.join(__dirname, 'sertificate/server.key')),
                cert: fs.readFileSync(path.join(__dirname, 'sertificate/server.cert')),
            },
        },
        client: {
            logging: 'none', // Отключает вывод сообщений Webpack Dev Server в консоли браузера
            overlay: false, // Полностью отключает оверлеи ошибок и предупреждений
        },
    },
    stats: {
        all: false,
        errors: true,
        warnings: true,
        errorsCount: true,
        warningsCount: true,
    },
};
