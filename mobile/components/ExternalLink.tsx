import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, TouchableOpacity, Text } from 'react-native';

export function ExternalLink(
  props: React.ComponentProps<typeof TouchableOpacity> & { href: string }
) {
  return (
    <TouchableOpacity
      {...props}
      onPress={() => {
        if (Platform.OS !== 'web') {
          // Open the link in an in-app browser
          WebBrowser.openBrowserAsync(props.href);
        } else {
          // For web, open in a new tab
          window.open(props.href, '_blank');
        }
      }}
    >
      {props.children}
    </TouchableOpacity>
  );
}
