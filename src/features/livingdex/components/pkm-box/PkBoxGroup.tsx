import { ReactElement, useEffect, useRef, useState } from 'react'

import config from '@/config'
import { createBoxTitle } from '@/features/livingdex/services/presets/createBoxTitle'
import { DexBox, DexPokemonList, LoadedDex, NullableDexPokemon, PkFilter } from '@/features/livingdex/services/types'
import Button from '@/lib/components/Button'
import { getGameSetByGameId } from '@/lib/data-client/game-sets'
import { getPokemonEntry } from '@/lib/data-client/pokemon'
import { cn } from '@/lib/utils'
import { classNames } from '@/lib/utils/deprecated'
import { slugify } from '@/lib/utils/strings'

import PkImgFile from '../PkImgFile'
import { PkBox } from './PkBox'
import styles from './PkBox.module.css'
import { PkBoxCell } from './PkBoxCell'
import { PkBoxEmptyCell } from './PkBoxEmptyCell'
import { PkBoxGroupFilter } from './PkBoxGroupFilter'
import { PkBoxCellProps, PkBoxGroupProps, PkBoxGroupState, PkBoxProps } from './pkBoxTypes'

// Goes through a box and marks individual pokemon that match the given filter
function modifyFilteredBox(filter: PkFilter, box: DexBox): DexBox {
  let hasFilterMatch = false
  const updatedPokemon: DexPokemonList = box.pokemon.map((currentPokemon) => {
    const matchesFilter = pokemonMatcher(filter, currentPokemon)

    // Set the box level flag if we see our first match
    if (!hasFilterMatch && matchesFilter) {
      hasFilterMatch = true
    }

    return currentPokemon ? { ...currentPokemon, matchesFilter } : null
  })

  return { ...box, hasFilterMatch, pokemon: updatedPokemon }
}

// Normalizes strings to be compared for filtering
function normalizeFilterData(string: string): string {
  return slugify(string.trim()).replace(/-/g, '')
}

// Compares a pokemon to a filter and indicates whether there is a match
function pokemonMatcher(filter: PkFilter, currentPokemon: NullableDexPokemon): boolean {
  if (!currentPokemon) {
    return false
  }

  const { attribute = 'pid', query } = filter
  const pokemonAttribute = currentPokemon[attribute] ?? ''
  const pokemonAttributeSlug = normalizeFilterData(pokemonAttribute)
  const querySlug = normalizeFilterData(query)

  return pokemonAttributeSlug.includes(querySlug)
}

/*
Only include a box element if: 
 1) There is no filter
 2) You're in box view and the box matches the filter
 3) You're in list view and the pokemone matches the filter
*/
export function filterBoxElements(filter: PkFilter | null, element: ReactElement) {
  const { pokemonData, boxData } = element.props as Partial<PkBoxCellProps & PkBoxProps>
  return Boolean(!filter || boxData?.hasFilterMatch || pokemonData?.matchesFilter)
}

// Modifies a given dex by indicating whether individual pokemon and their box match the filter
export function createFilteredDex(dex: LoadedDex, filter: PkFilter): LoadedDex {
  const boxes = dex.boxes.map(modifyFilteredBox.bind(null, filter))
  return { ...dex, boxes }
}

export function PkBoxGroup(props: PkBoxGroupProps) {
  let initialPerPage = props.perPage || 1
  const loadMoreRef = useRef(null)
  const [state, setState] = useState<PkBoxGroupState>({
    filter: null,
  })

  const filteredDex = state.filter ? createFilteredDex(props.dex, state.filter) : props.dex

  if (props.viewMode === 'listed' || filteredDex.boxes.length <= 2) {
    initialPerPage = 10
  }

  const [perPage, setPerPage] = useState(initialPerPage)

  const handleLoadMore = (): void => {
    setPerPage(Math.min(perPage + initialPerPage, totalBoxCount))
    // setIsIntersecting(false)
  }

  // Sets the new filter state
  const handleBoxFilter = (filter: PkFilter): void => {
    setState({ filter })
  }

  useEffect(() => {
    if (!loadMoreRef.current || !IntersectionObserver) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        //setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting) {
          handleLoadMore()
        }
      },
      { rootMargin: '100px' },
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [perPage])

  const { usePixelIcons } = props
  const boxElements: ReactElement[] = []
  const shinyBoxElements: ReactElement[] = []
  const initialTabIndex = 1

  filteredDex.boxes.forEach((box, boxIndex) => {
    const boxListToPush = box.shiny ? shinyBoxElements : boxElements
    const boxCells: any[] = []
    const boxTabIndex = props.selectMode === 'box' ? initialTabIndex + boxIndex : undefined
    box.pokemon.forEach((cellPkm, cellIndex) => {
      let cellTabIndex: number | undefined =
        initialTabIndex + filteredDex.boxes.length + boxIndex * config.limits.maxPokemonPerBox + cellIndex

      if (props.selectMode === 'box') {
        cellTabIndex = undefined
      }

      if (cellPkm === null) {
        //  || (cellPkm.shiny && cellPkm.shinyBase)
        boxCells.push(
          <PkBoxEmptyCell
            boxIndex={boxIndex}
            pokemonIndex={cellIndex}
            tabIndex={cellTabIndex}
            pokemonData={cellPkm}
            revealPokemon={props.revealPokemon}
            viewMode={props.viewMode}
            selectMode={props.selectMode}
            usePixelIcons={usePixelIcons}
            key={`placeholder-${boxIndex}-${cellIndex}`}
          />,
        )
        return
      }

      const slug = cellPkm.pid
      const pkmEntry = getPokemonEntry(slug)
      let title = pkmEntry.name
      let isSpecialAbilityPkm = false
      const isHiddenAbilityPkm = false // TODO support in future

      if (slug.includes('--')) {
        isSpecialAbilityPkm = true
      }

      const classes = classNames(
        'pkBox-cell',
        cellPkm.caught ? styles.caught : styles.uncaught,
        cellPkm.shiny ? styles.shiny : '',
        cellPkm.shinyLocked ? styles.shinyLocked : '',
        cellPkm.shinyBase !== null ? styles.hasShinyBase : '',
      )

      if (pkmEntry.form.hasGenderForms && !pkmEntry.form.isFemaleForm) {
        title += ' ♂'
      }

      if (pkmEntry.form.hasGenderForms && pkmEntry.form.isFemaleForm) {
        title += ' ♀'
      }

      if (pkmEntry.form.isGmax) {
        title += ' Gigantamax'
      }

      if (cellPkm.shiny && cellPkm.shinyBase) {
        title += ', same color as ' + getPokemonEntry(cellPkm.shinyBase).name
      }

      if (cellPkm.shiny && cellPkm.shinyLocked) {
        title += ' (Shiny Not Available)'
      }

      boxCells.push(
        <PkBoxCell
          boxIndex={boxIndex}
          pokemonIndex={cellIndex}
          tabIndex={cellTabIndex}
          pokemonData={cellPkm}
          key={`${slug}-${boxIndex}-${cellIndex}`}
          viewMode={props.viewMode}
          selectMode={props.selectMode}
          revealPokemon={props.revealPokemon}
          onClick={props.onPokemonClick}
          className={classes}
        >
          <PkImgFile
            nid={cellPkm.nid}
            title={title}
            shiny={cellPkm.shiny}
            variant={usePixelIcons ? 'pixelart' : '3d'}
          />
          <span className={styles.pkBoxCellLabel}>{title}</span>
          {props.markTypes.includes('catch') && (
            <>
              <i className={[styles.ballIcon, styles.ballIconCaught, 'icon-pkg-pokeball'].join(' ')}>
                <i className={[styles.subIcon, 'icon-pkg-pokeball-outlined'].join(' ')} />
              </i>
              <i className={[styles.ballIcon, styles.ballIconUncaught, 'icon-pkg-pokeball-outlined'].join(' ')} />
            </>
          )}
          {cellPkm.shiny && props.markTypes.includes('shiny') && <i className={styles.shinyIcon + ' icon-pkg-shiny'} />}
          {cellPkm.gmax && props.markTypes.includes('gmax') && <i className={styles.gmaxIcon + ' icon-pkg-dynamax'} />}
          {cellPkm.alpha && props.markTypes.includes('alpha') && <i className={styles.alphaIcon + ' icon-pkg-wild'} />}
          {isSpecialAbilityPkm && props.markTypes.includes('ability') && <i className={styles.abilityIcon}>SA</i>}
          {isHiddenAbilityPkm && props.markTypes.includes('ability') && <i className={styles.abilityIcon}>HA</i>}
        </PkBoxCell>,
      )
    })

    // Only push into the list if we have anything to push
    if (props.viewMode === 'listed' && boxCells.length) {
      boxListToPush.push(...boxCells)
      return
    }

    const nextIdx = boxListToPush.length + 1
    const boxTitle = createBoxTitle(props.dex.gameSetId, box.title, nextIdx)
    const isOverflowing = nextIdx > getGameSetByGameId(props.dex.gameId).storage.boxes
    const boxContent = (
      <PkBox
        boxIndex={boxIndex}
        key={boxIndex + `${box.shiny ? '-shiny' : '-regular'}`}
        boxData={box}
        // editable={props.editable}
        editable={false} // disabled for now
        shiny={box.shiny}
        isOverflowing={isOverflowing}
        onBoxTitleEdit={props.onBoxTitleEdit}
        viewMode={props.viewMode}
        selectMode={props.selectMode}
        tabIndex={boxTabIndex}
        // title={box.title || `[Box ${boxIndex + 1}]`}
        title={boxTitle}
        onClick={props.onBoxClick}
      >
        {boxCells}
      </PkBox>
    )
    boxListToPush.push(boxContent)
  })

  const boxElementsToUse = props.showShiny ? shinyBoxElements : boxElements
  const totalBoxCount = boxElementsToUse.length

  // We only want to filter the boxes if there is an active filter
  const filteredBoxElements = state.filter
    ? boxElementsToUse.filter(filterBoxElements.bind(null, state.filter))
    : boxElementsToUse

  const pagedBoxElements = filteredBoxElements.slice(0, perPage)
  const hasMoreBoxes = perPage < totalBoxCount

  // const handleLoadAll = (): void => {
  //   setPerPage(totalBoxCount)
  // }

  const loadMoreBtn = hasMoreBoxes ? (
    <div key="load-more-btn" className={styles.loadMoreBtnCell} ref={loadMoreRef}>
      <div className="text-center">
        <Button onClick={handleLoadMore}>Load More</Button>
        {/* <Button onClick={handleLoadAll}>Load All</Button> */}
      </div>
    </div>
  ) : null

  const classes = classNames(
    styles.pkBoxGroup,
    styles[props.selectMode + 'SelectMode'],
    styles[props.viewMode + 'ViewMode'],
    props.editable ? styles.editable : styles.nonEditable,
  )

  const groupContentClasses = cn(
    styles.pkBoxGroupContent,
    'pkBoxCount-' + boxElements.length,
    styles[`pkBoxGroupContent-${props.viewMode}`],
  )
  return (
    <div className={'pkBoxGroupWr'}>
      {props.showNonShiny && (
        <div className={'pkBoxGroupWr pkBoxGroupWr-regular'}>
          <PkBoxGroupFilter onChange={handleBoxFilter} />
          <div className={classes}>
            <div className={groupContentClasses}>
              {pagedBoxElements}
              {loadMoreBtn}
            </div>
          </div>
        </div>
      )}
      {props.showShiny && (
        <div className={'pkBoxGroupWr pkBoxGroupWr-shiny'}>
          <PkBoxGroupFilter onChange={handleBoxFilter} />
          <div className={classes}>
            <div className={groupContentClasses}>{pagedBoxElements}</div>
          </div>
          {loadMoreBtn}
        </div>
      )}
    </div>
  )
}
