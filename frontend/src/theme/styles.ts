import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  metric: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 8,
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  spacing: {
    height: 80,
  },
});

export const colors = {
  primary: '#6200ee',
  accent: '#03dac6',
  error: '#cf6679',
  success: '#4caf50',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#212121',
  textSecondary: '#757575',
};
