import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';

export default function SQLiteTest() {
  useEffect(() => {
    console.log('SQLite:', SQLite);
    const db = SQLite.openDatabase('test.db');
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, value TEXT);'
      );
    });
  }, []);

  return (
    <View><Text>SQLite Test Screen</Text></View>
  );
}
