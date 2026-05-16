import { isShinyLocked } from '../../../lib/data-client/pokemon'
import { DexPokemon, LoadedDex } from './types'

export const isCatchable = (pokemon: DexPokemon): boolean => {
  return !(pokemon.shiny && isShinyLocked(pokemon.pid))
}

export function legacyCanCreateMoreDexes(): boolean {
  return true
}

export function recalculateCounters(dex: LoadedDex): LoadedDex {
  const counters = dex.boxes.reduce(
    (accumulator, box) => {
      return box.pokemon.reduce((acc, pokemon) => {
        if (!pokemon) {
          return accumulator
        }
        if (pokemon.shiny && !pokemon.shinyLocked) {
          accumulator.totalShiny++
          if (pokemon.caught) {
            accumulator.caughtShiny++
          }
          return accumulator
        }

        if (!pokemon.shiny) {
          accumulator.totalRegular++
          if (pokemon.caught) {
            accumulator.caughtRegular++
          }
        }
        return accumulator
      }, accumulator)
    },
    {
      caughtRegular: 0,
      totalRegular: 0,
      caughtShiny: 0,
      totalShiny: 0,
    },
  )

  return {
    ...dex,
    ...counters,
  }
}
