import { AntDesign, Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, Text, View, Image, TouchableHighlight, Pressable } from "react-native"
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
        <Text className='text-zinc-200 text-lg font-bold'>#{getPokemonId(pokemon.item.url)}</Text>
      </View>
    </View>
  )
}

type PokemonPreview = {
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

function PokemonPreview({ pokemonId, pokemonName }: { pokemonId: string, pokemonName: string }) {
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

export default function EditScreenInfo({ path }: { path: string }) {
  const chunkSize = 25
  const [cursorPos, setCursorPos] = useState(0)
  const [offset, setOffset] = useState(0)
  const [prevOffset, setPrevOffset] = useState(0)
  const [data, setData] = useState<PokemonFetch | null>(null)
  const [nextData, setNextData] = useState<PokemonFetch | null>(null)

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


  const [selectedMon, setSelectedMon] = useState<{ name: string, url: string } | null>(null)
  const FlatListRef = useRef<FlatList>(null)

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
        ? <PokemonPreview pokemonId={getPokemonId(selectedMon?.url)} pokemonName={selectedMon?.name} />
        : null
      }
      <View className='flex flex-row items-center w-full justify-between px-2'>
        <TouchableHighlight>
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
      <SafeAreaView className='w-full h-[78%] flex-1'>
        <FlatList className='my-2'
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
