import * as raw from 'expo-sqlite';
console.log('✅ expo-sqlite loaded:', raw.openDatabase?.name ?? 'NOT FOUND');
export const SQLite = raw;
