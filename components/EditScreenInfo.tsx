import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, ScrollView, Text, View, Image, Button } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';

type PokemonFetch = {
  count: number
  next: string | null
  previous: string | null
  results: { name: string, url: string }[]
}

function getSprite(urlForPokemon: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(urlForPokemon)}.png`
}

function getPokemonId(urlForPokemon: string): string {
  const split = urlForPokemon.split("/pokemon/")
  return split[1].split("/")[0]
}

function ListItem({ pokemon }: { pokemon: ListRenderItemInfo<{ name: string, url: string, cursorPos: number, offset: number }> }) {
  const currentChunkIdx = pokemon.item.offset !== 0 ? pokemon.item.cursorPos - pokemon.item.offset : pokemon.item.cursorPos
  return (
    <View className={`flex flex-row border-b border-zinc-700 w-full items-center gap-2 text-zinc-200 font-semibold ${pokemon.index === currentChunkIdx ? "bg-zinc-500" : ""}`}>
      <Image className="w-20 h-20" source={{ uri: getSprite(pokemon.item.url) }} />
      <View className='flex flex-row items-center justify-between w-[70%]'>
        <Text className='text-zinc-200 text-lg capitalize'>{pokemon.item.name}</Text>
        <Text className='text-zinc-200 text-lg font-bold'>#{getPokemonId(pokemon.item.url)} {pokemon.index}</Text>
      </View>
    </View>
  )
}

export default function EditScreenInfo({ path }: { path: string }) {
  const chunkSize = 25
  const [cursorPos, setCursorPos] = useState(0)
  const [offset, setOffset] = useState(0)
  const FlatListRef = useRef<FlatList>(null)

  const { isLoading, error, data, refetch } = useQuery<PokemonFetch, Error>({
    queryKey: ["pokemon-list", offset],
    queryFn: async () => {
      const url = `https://pokeapi.co/api/v2/pokemon?limit=${chunkSize}&offset=${offset}`
      const res = await fetch(url)
      const data = await res.json()

      return data
    },
  })

  useEffect(() => {
    if (!FlatListRef || !data) return
    const currentChunkIdx = offset !== 0 ? cursorPos - offset : cursorPos
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx
    })

  }, [data])

  function scrollDown() {
    const currentChunkIdx = offset !== 0 ? cursorPos - offset : cursorPos

    if (currentChunkIdx === chunkSize - 1) {
      setOffset(offset + chunkSize)
      setCursorPos(cursorPos + 1)
      return
    }

    setCursorPos(cursorPos + 1)
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx
    })
  }

  function scrollUp() {
    const currentChunkIdx = offset !== 0 ? cursorPos - 1 - offset : cursorPos - 1

    if (offset === 0 && currentChunkIdx - 1 < 0) return
    const isAtStartOfChunk = (offset - cursorPos) % chunkSize === 0
    if (isAtStartOfChunk) {
      setOffset(offset - chunkSize)
      setCursorPos(cursorPos - 1)
      return
    }

    setCursorPos(cursorPos - 1 < 0 ? 0 : cursorPos - 1)
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx - 1 < 0 ? chunkSize - 1 : currentChunkIdx - 1
    })
  }

  if (isLoading) {
    return (
      <View>
        <Text className='text-zinc-200 text-center'>Loading...</Text>
      </View>
    )
  }

  return (
    <View className='w-full'>
      <Text className='text-2xl text-zinc-200 font-extrabold px-2'>Pokedex</Text>
      <Text className='text-zinc-200 text-center'>#{cursorPos + 1}</Text>
      <View className='flex flex-row items-center w-full justify-between px-2'>
        <Button title="up" onPress={scrollUp} />
        <Button title="down" onPress={scrollDown} />
      </View>
      <SafeAreaView className='w-full h-[70%]'>
        <FlatList className='my-2 mb-12'
          ref={FlatListRef}
          data={data?.results}
          renderItem={(pokemon) => {
            const data = { ...pokemon, item: { ...pokemon.item, cursorPos, offset: offset } }
            return <ListItem pokemon={data} />
          }}
        />
      </SafeAreaView>
    </View>
  );
}
