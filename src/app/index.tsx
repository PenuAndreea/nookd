import { useEffect, useState } from 'react'
import { Button, FlatList, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Index() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    getRooms()
  }, [])

  async function getRooms() {
    const { data } = await supabase.from('rooms').select()
    console.log('Rooms data:', data)
    setRooms(data)
  }

  async function createRoom() {
    const { data, error } = await supabase.from('rooms').insert({ name: 'New Room' }).select()
    if (error) {
      console.error('Error creating room:', error)
    } else {
      setRooms(data)
    }
  }

  return (
    <View style={styles.container}>
      <Button title="Create Room" onPress={createRoom} />
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.name}</Text>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
})