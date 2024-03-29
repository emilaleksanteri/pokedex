import { Text } from "@/components/Themed";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, StatusBar } from 'react-native';
import { View } from '@/components/Themed';

export default function PokemonPage() {
  const { id } = useLocalSearchParams()

  return (
    <View style={styles.container}>
      <Text>{id}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
});
