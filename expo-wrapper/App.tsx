import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

export default function App() {
  const url = Constants.manifest?.extra?.WEBAPP_URL || 'https://rendt.github.io/genius';
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
