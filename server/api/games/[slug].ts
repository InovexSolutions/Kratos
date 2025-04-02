// Game data lookup (in a real app, this would come from the database)
type Game = {
  name: string;
  slug: string;
  description: string;
  image: string;
};

const games: { [key: string]: Game } = {
  'minecraft': {
    name: 'Minecraft Server',
    slug: 'minecraft',
    description: 'Create your own Minecraft world',
    image: '/img/games/minecraft.jpg'
  },
  'rust': {
    name: 'Rust Server',
    slug: 'rust',
    description: 'Survive in the harsh wilderness',
    image: '/img/games/rust.jpg'
  },
  'valheim': {
    name: 'Valheim Server',
    slug: 'valheim',
    description: 'Epic Viking adventure',
    image: '/img/games/valheim.jpg'
  }
}

export default defineEventHandler((event) => {
  const slug = event.context.params?.slug
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug is required'
    })
  }
  const game = games[slug]
  
  if (!game) {
    throw createError({
      statusCode: 404,
      message: 'Game not found'
    })
  }
  
  return game
})