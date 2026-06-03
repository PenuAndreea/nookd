import { StyleSheet, Text, View } from 'react-native'

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.item}>Welcome to Nookd!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 150,
    paddingHorizontal: 16,
  },
  item: {
    padding: 16,
    fontSize: 18,
    borderBottomColor: '#ccc',
  },
})