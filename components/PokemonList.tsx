import { getPokemonId, getSprite } from '@/lib/pokemonHelpers';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, Text, View, Image, TouchableHighlight } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
import { PokemonPreviewSection } from './PokemonPreview';

export type PokemonFetch = {
  count: number
  next: string | null
  previous: string | null
  results: { name: string, url: string }[]
}

export function PokemonList() {
  const chunkSize = 25
  const [cursorPos, setCursorPos] = useState(0)
  const [offset, setOffset] = useState(0)
  const [prevOffset, setPrevOffset] = useState(0)
  const [data, setData] = useState<PokemonFetch | null>(null)
  const [nextData, setNextData] = useState<PokemonFetch | null>(null)
  const [selectedMon, setSelectedMon] = useState<{ name: string, url: string } | null>(null)
  const FlatListRef = useRef<FlatList>(null)

  async function fetchNextData() {
    if (nextData) {
      const nextUrl = `https://pokeapi.co/api/v2/pokemon?limit=${chunkSize}&offset=${offset + chunkSize}`
      const nextRes = await fetch(nextUrl)
      const nextDataJson = await nextRes.json()
      setNextData(nextDataJson)
    } else {
      const nextUrl = `https://pokeapi.co/api/v2/pokemon?limit=${chunkSize}&offset=${offset + chunkSize}`
      const nextRes = await fetch(nextUrl)
      const nextDataJson = await nextRes.json()
      setNextData(nextDataJson)

    }
  }

  const { isLoading } = useQuery<PokemonFetch, Error>({
    queryKey: ["pokemon-list", offset],
    queryFn: async () => {
      if (prevOffset > offset) {
        const url = `https://pokeapi.co/api/v2/pokemon?limit=${chunkSize}&offset=${offset}`
        const res = await fetch(url)
        const data = await res.json()
        setData(data)
        fetchNextData()

        return data
      }

      if (nextData) {
        setData(nextData)
        fetchNextData()
        return nextData
      } else {

        const url = `https://pokeapi.co/api/v2/pokemon?limit=${chunkSize}&offset=${offset}`
        const res = await fetch(url)
        const data = await res.json()
        setData(data)

        fetchNextData()
        return data
      }
    },
  })

  useEffect(() => {
    if (!FlatListRef || !data) return
    const currentChunkIdx = offset !== 0 ? cursorPos - offset : cursorPos
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx
    })

    setSelectedMon(data.results[currentChunkIdx])

  }, [data])

  function scrollDown() {
    const currentChunkIdx = offset !== 0 ? cursorPos - offset : cursorPos

    if (currentChunkIdx === chunkSize - 1) {
      setPrevOffset(offset)
      setOffset(offset + chunkSize)
      setCursorPos(cursorPos + 1)
      return
    }

    setCursorPos(cursorPos + 1)
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx + 1
    })

    setSelectedMon(data?.results[currentChunkIdx + 1] ?? null)
  }

  function scrollUp() {
    const currentChunkIdx = offset !== 0 ? cursorPos - 1 - offset : cursorPos - 1

    if (offset === 0 && currentChunkIdx < 0) return
    const isAtStartOfChunk = (offset - cursorPos) % chunkSize === 0
    if (isAtStartOfChunk) {
      setPrevOffset(offset)
      setOffset(offset - chunkSize)
      setCursorPos(cursorPos - 1)
      return
    }

    setCursorPos(cursorPos - 1 < 0 ? 0 : cursorPos - 1)
    FlatListRef.current?.scrollToIndex({
      animated: true,
      index: currentChunkIdx
    })


    setSelectedMon(data?.results[currentChunkIdx] ?? null)
  }

  if (isLoading) {
    return (
      <View>
        <Text className='text-zinc-200 text-center'>Loading...</Text>
      </View>
    )
  }

  return (
    <View className='w-full h-[720px] py-4 pt-10'>
      <View className='flex flex-row items-center gap-2 px-4'>
        <Text className='text-zinc-200 text-2xl font-extrabold tracking-wide capitalize'>
          {selectedMon?.name}
        </Text>
        <Text className='text-zinc-200 text-2xl font-extrabold tracking-wide capitalize'>
          #{cursorPos + 1}
        </Text>
      </View>
      {selectedMon
        ? <PokemonPreviewSection pokemonId={getPokemonId(selectedMon?.url)} pokemonName={selectedMon?.name} />
        : null
      }
      <View className='flex flex-row items-center w-full justify-between px-2'>
        <TouchableHighlight onPress={() => {
          if (!selectedMon) return
          router.push(`/pokemon/${getPokemonId(selectedMon?.url)}`)
        }
        }>
          <Feather name="plus-square" size={50} color="white" />
        </TouchableHighlight>
        <View className='flex flex-row gap-2'>
          <TouchableHighlight onPress={scrollUp}>
            <AntDesign name="caretup" size={50} color="white" />
          </TouchableHighlight>
          <TouchableHighlight onPress={scrollDown}>
            <AntDesign name="caretdown" size={50} color="white" />
          </TouchableHighlight>
        </View>
      </View>
      <SafeAreaView className='w-full pl-2 flex items-center justify-center h-[75%] flex-1'>
        <FlatList className='py-2 w-[95%] pl-2'
          onScrollToIndexFailed={() => {
            setCursorPos(offset !== 0 ? offset : 0)
            FlatListRef.current?.scrollToIndex({
              animated: true,
              index: offset !== 0 ? offset : 0
            })
          }}

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

type ListItemProps = {
  pokemon: ListRenderItemInfo<{ name: string, url: string, cursorPos: number, offset: number }>
}

function ListItem({ pokemon }: ListItemProps) {
  const currentChunkIdx = pokemon.item.offset !== 0 ? pokemon.item.cursorPos - pokemon.item.offset : pokemon.item.cursorPos
  return (
    <View
      className={
        `flex flex-row w-full items-center pb-2 pr-2 gap-2 font-semibold ${pokemon.index === currentChunkIdx ? "bg-neutral-50" : "bg-[#CC0000]"}`
      }>
      <Image className="w-20 h-20" source={{ uri: getSprite(pokemon.item.url) }} />
      <View className='flex flex-row items-center justify-between w-[70%]'>
        <Text
          className={
            `${currentChunkIdx === pokemon.index ? "text-zinc-600 font-bold" : "text-zinc-200"} text-xl capitalize`
          }>
          {pokemon.item.name}
        </Text>
        <Text
          className={
            `${currentChunkIdx === pokemon.index ? "text-zinc-600 font-bold" : "text-zinc-200"} text-xl capitalize`
          }>
          #{getPokemonId(pokemon.item.url)}
        </Text>
      </View>
    </View>
  )
}
