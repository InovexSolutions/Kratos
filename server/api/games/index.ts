export default defineEventHandler(async () => {
  // In a real app, this data would come from a database
  const games = [
    {
      id: 1,
      name: 'Minecraft',
      slug: 'minecraft',
      description: 'Build, explore, and survive in your own blocky universe',
      image: '/images/games/minecraft.png',
      minPrice: 2.99,
      category: 'survival',
      tags: ['popular', 'sandbox'],
      features: ['Mod Support', '1-Click Install', 'SSD Storage', 'Auto Backups'],
      soldOut: false
    },
    {
      id: 2,
      name: 'Valheim',
      slug: 'valheim',
      description: 'Conquer the tenth Norse world with your clan',
      image: '/images/games/valheim.png',
      minPrice: 7.99,
      category: 'survival',
      tags: ['multiplayer', 'viking'],
      features: ['Auto Updates', 'World Backups', 'Dedicated IP', 'Custom Mods'],
      soldOut: true
    },
    {
      id: 3,
      name: 'Rust',
      slug: 'rust',
      description: 'Survive the ultimate multiplayer survival experience',
      image: '/images/games/rust.png',
      minPrice: 9.99,
      category: 'survival',
      tags: ['pvp', 'multiplayer'],
      features: ['Wipe Scheduler', 'High Performance', 'Mod Manager', 'DDOS Protection'],
      soldOut: true
    },
    {
      id: 4,
      name: 'ARK: Survival Evolved',
      slug: 'ark',
      description: 'Tame dinosaurs, build bases, and survive on a prehistoric island',
      image: '/images/games/ark.png',
      minPrice: 12.99,
      category: 'survival',
      tags: ['dinosaurs', 'multiplayer'],
      features: ['Cross-Server Clusters', 'Custom Maps', 'Auto-Restart', 'Daily Backups'],
      soldOut: true
    },
    {
      id: 5,
      name: 'CS2',
      slug: 'cs2',
      description: 'Join the world\'s most popular competitive tactical shooter',
      image: '/images/games/cs2.png',
      minPrice: 8.99,
      category: 'fps',
      tags: ['competitive', 'esports'],
      features: ['Anti-Cheat', 'Custom Plugins', '128-tick', 'Low Latency'],
      soldOut: true
    },
    {
      id: 6,
      name: 'Project Zomboid',
      slug: 'project_zomboid',
      description: 'How will you die in the zombie apocalypse?',
      image: '/images/games/zomboid.png',
      minPrice: 5.99,
      category: 'survival',
      tags: ['zombies', 'multiplayer'],
      features: ['Custom Workshop Mods', 'Map Selection', 'Automatic Updates', 'Server Monitoring'],
      soldOut: true
    }
  ];

  return games;
});