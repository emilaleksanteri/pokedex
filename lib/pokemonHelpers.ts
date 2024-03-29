export function getSprite(urlForPokemon: string): string {
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(urlForPokemon)}.png`
}

export function getPokemonId(urlForPokemon: string): string {
	const split = urlForPokemon.split("/pokemon/")
	return split[1].split("/")[0]
}
