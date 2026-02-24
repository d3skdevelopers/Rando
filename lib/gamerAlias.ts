const ADJECTIVES = [
  'Toxic','Cracked','Clutch','Silent','Phantom',
  'Stealth','Raging','Infinite','Neon','Hungry',
  'Cursed','Hyper','Wild','Cyber','Shadow',
]
const CREATURES = [
  'Cobra','Phoenix','Rhino','Mantis','Viper',
  'Falcon','Lynx','Titan','Drake','Specter',
  'Mamba','Reaper','Golem','Wraith','Hydra',
]

export function generateGamerAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const cr  = CREATURES[Math.floor(Math.random() * CREATURES.length)]
  return `${adj} ${cr}`
}
