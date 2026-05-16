import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const datasetRepo = process.env.POKEPC_DATASET_REPO || 'https://github.com/pokepc/dataset.git'
const datasetRef = process.env.POKEPC_DATASET_REF || 'main'
const datasetPresetPath = 'data/boxpresets/classic'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const destFile = path.join(__dirname, 'legacy-boxpresets.min.json')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokepc-dataset-'))

const bundledPresets: Record<string, any> = {}

function runGit(args: string[]) {
  execFileSync('git', args, {
    stdio: 'inherit',
  })
}

try {
  runGit(['clone', '--depth=1', '--filter=blob:none', '--sparse', '--branch', datasetRef, datasetRepo, tmpDir])
  runGit(['-C', tmpDir, 'sparse-checkout', 'set', datasetPresetPath])

  const srcDir = path.join(tmpDir, datasetPresetPath)
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Dataset box presets directory does not exist: ${srcDir}`)
  }

  const files = fs
    .readdirSync(srcDir)
    .filter((file) => file.endsWith('.json'))
    .sort()

  if (files.length === 0) {
    throw new Error(`Dataset box presets directory has no JSON files: ${srcDir}`)
  }

  for (const file of files) {
    const data = fs.readFileSync(path.join(srcDir, file), 'utf8')
    const json = JSON.parse(data)
    bundledPresets[file.replace('.json', '')] = json
  }

  fs.writeFileSync(destFile, JSON.stringify(bundledPresets))
  console.log(
    `Bundled ${Object.keys(bundledPresets).length} presets from ${datasetRepo}#${datasetRef}:${datasetPresetPath} into ${destFile}`,
  )
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
