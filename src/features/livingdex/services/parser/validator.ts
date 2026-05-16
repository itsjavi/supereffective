import { ZodType, z } from 'zod'

import { slugSchema } from '@/lib/validation/schemas'
import errors from './errors'
import {
  LIVINGDEX_DOC_SPEC_PROP_TYPES,
  LIVINGDEX_DOC_SPEC_VERSIONS,
  LivingDexDocBoxByFormat,
  LivingDexDocMeta,
  LivingDexDocSpecConfig,
  LivingDexDocSpecPropType,
} from './types'

export const createLivingDexTypeValidator = (typeName: LivingDexDocSpecPropType): ZodType => {
  const slugType = z
    .string()
    .regex(/[a-zA-Z0-9-_]+/)
    .max(50)

  switch (typeName) {
    case 'boolean':
      return z.boolean()
    case 'number':
      return z.number()
    case 'number[]':
      return z.array(z.number())
    case 'number:int':
      return z.number().int()
    case 'number:int[]':
      return z.array(z.number().int())
    case 'string':
      return z.string()
    case 'string[]':
      return z.array(z.string())
    case 'string:slug':
      return slugType
    case 'string:slug[]':
      return z.array(slugType)
    case 'string:text':
      return z.string().max(160)
    default:
      throw new Error('Invalid property type: ' + typeName, errors.LIVINGDEX.INVALID_PROP_TYPE)
  }
}

export const createLivingDexFormatValidator = (): ZodType<LivingDexDocSpecConfig> => {
  const propsTypesValidator = z.array(z.tuple([z.string(), z.enum(LIVINGDEX_DOC_SPEC_PROP_TYPES)]))

  return z.object({
    version: z.enum(LIVINGDEX_DOC_SPEC_VERSIONS),
    arrayDelimiters: z.tuple([z.string().length(1), z.string().length(1)]),
    arraySeparator: z.string().length(1),
    propertySeparator: z.string().length(1),
    boxPrefix: z.string().min(1).max(2),
    pokemonPrefix: z.string().min(1).max(2),
    boxProperties: propsTypesValidator,
    pokemonProperties: propsTypesValidator,
  }) as ZodType<LivingDexDocSpecConfig>
}

export const createLivingDexMetadataValidator = (): ZodType<LivingDexDocMeta> => {
  return z.object({
    $id: z.string(),
    format: z.enum(LIVINGDEX_DOC_SPEC_VERSIONS),
    title: z.string(),
    gameId: slugSchema,
    ownerId: z.string(), //.regex(/^@.+/),
    creationTime: z.string().datetime(),
    lastUpdateTime: z.string().datetime(),
    legacyPresetId: z.string().optional(),
    legacyPresetVersion: z.number().int().optional(),
  })
}

export const createLivingDexBoxValidator = (
  format: LivingDexDocSpecConfig,
): ZodType<LivingDexDocBoxByFormat<typeof format.version>> => {
  const boxShape: Record<string, ZodType> = {}
  const pkmShape: Record<string, ZodType> = {}

  for (const prop of format.boxProperties) {
    const [propName, typeName] = prop
    boxShape[propName] = createLivingDexTypeValidator(typeName)
  }

  // TODO: improve/refactor this part (required Pkm Props):
  const requiredPkmProps = ['id', 'captured', 'shiny']

  for (const prop of format.pokemonProperties) {
    const [propName, typeName] = prop
    const pkmPropValidator = createLivingDexTypeValidator(typeName)
    pkmShape[propName] = requiredPkmProps.includes(propName) ? pkmPropValidator : pkmPropValidator.optional()
  }

  return z.object({
    ...boxShape,
    pokemon: z.array(z.object(pkmShape).or(z.null())),
  }) as unknown as ZodType<LivingDexDocBoxByFormat<typeof format.version>>
}
