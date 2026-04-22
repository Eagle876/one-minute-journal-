const ADJECTIVES = [
  'Calm', 'Serene', 'Peaceful', 'Mindful', 'Gentle', 'Kind', 'Brave', 'Strong',
  'Wise', 'Patient', 'Joyful', 'Radiant', 'Steady', 'Quiet', 'Bright', 'Warm'
];

const NOUNS = [
  'Mountain', 'River', 'Forest', 'Ocean', 'Star', 'Moon', 'Sun', 'Tree',
  'Leaf', 'Cloud', 'Bird', 'Deer', 'Panda', 'Koala', 'Lotus', 'Willow'
];

export function generateAnonymousName(seed: string): string {
  // Simple hash function for the seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const absHash = Math.abs(hash);
  const adjIndex = absHash % ADJECTIVES.length;
  const nounIndex = (absHash >> 4) % NOUNS.length;
  
  return `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;
}
