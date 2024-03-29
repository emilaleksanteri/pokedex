import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';

export type PokemonPreview = {
  id: number,
  sprites: {
    other: {
      showdown: {
        front_default: string
        back_default: string
      }
    }
  },
  types: {
    slot: number
    type: {
      name: string,
      url: string
    }
  }[],
  stats: {
    base_stat: number
    effort: number
    stat: {
      name: string
      url: string
    }
  }[],
  cries: {
    latest: string
  },
}

function RotateImage({ pokemon }: { pokemon: PokemonPreview }) {
  const [img, setImg] = useState(pokemon.sprites.other.showdown.front_default)

  useEffect(() => {
    setImg(pokemon.sprites.other.showdown.front_default)
  }, [pokemon])

  const handleRoate = () => {
    if (img === pokemon.sprites.other.showdown.front_default) {
      setImg(pokemon.sprites.other.showdown.back_default)
    } else {
      setImg(pokemon.sprites.other.showdown.front_default)
    }
  }
  return (
    <Pressable onPress={handleRoate}>
      <Image
        style={{ width: "100%", height: "100%" }}
        resizeMode='contain'
        source={{ uri: img }}
      />
    </Pressable>
  )
}

export function PokemonPreviewSection({ pokemonId, pokemonName }: { pokemonId: string, pokemonName: string }) {
  const { isLoading, data } = useQuery<PokemonPreview | Error>({
    queryKey: ["pokemon-preview", pokemonId],
    queryFn: async () => {
      const url = `https://pokeapi.co/api/v2/pokemon/${pokemonId}/`
      const res = await fetch(url)
      const data = await res.json()

      return data
    },
  })

  if (isLoading) {
    return (
      <View className='w-full py-24 flex flex-col items-center justify-center px-4 my-1'>
        <Text className='text-zinc-200 text-center capitalize text-2xl p-2'>Loading {pokemonName}...</Text>
      </View>
    )
  }

  if (data instanceof Error || !data) {
    return null
  }

  return (
    <View className='w-full flex flex-row gap-4 items-center px-4 justify-center'>
      <View className='bg-zinc-900 rounded-t-md rounded-bl-xl rounded-br-md border-[12px] border-zinc-200 w-44 h-44 p-2 drop-shadow-md'>
        <RotateImage pokemon={data} />
      </View>
      <SafeAreaView>
        <FlatList
          data={data.stats}
          renderItem={(stat) => {
            return (
              <View className='flex flex-row items-center gap-2'>
                <Text className='text-zinc-200 text-base capitalize'>{stat.item.stat.name}</Text>
                <Text className='text-zinc-200 text-lg font-bold'>{stat.item.base_stat}</Text>
              </View>
            )
          }}
        />
      </SafeAreaView>
    </View>
  )
}
