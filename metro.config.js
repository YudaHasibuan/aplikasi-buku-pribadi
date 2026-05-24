const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tambahkan wasm ke asset extensions agar expo-sqlite dapat berjalan di platform web
config.resolver.assetExts.push('wasm');

module.exports = config;
