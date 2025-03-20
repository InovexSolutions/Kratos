<!-- Import the GameCard -->
<!-- import GameCard from '@/components/landing/GameCard.vue'; -->
<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <!-- Navbar -->
        <NavBar class="sticky top-0 z-50" />

        <!-- Hero Section -->
        <section class="relative py-32 overflow-hidden">
            <div class="container mx-auto px-4 text-center">
                <div class="max-w-4xl mx-auto">
                    <h1
                        class="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in-up">
                        Level Up Your Gaming Experience
                    </h1>
                    <p class="text-xl text-gray-300 mb-8 animate-fade-in-up delay-100">
                        Blazing-fast game servers with 99.9% uptime and instant setup
                    </p>
                    <div class="animate-fade-in-up delay-200">
                        <button @click="scrollToGames"
                            class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
                            Start Your Server Now →
                        </button>
                    </div>

                    <!-- Stats Bar -->
                    <div class="mt-16 flex justify-center gap-12 animate-slide-in-right">
                        <div class="text-center">
                            <div class="text-4xl font-bold text-blue-400">15K+</div>
                            <div class="text-gray-400">Happy Gamers</div>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl font-bold text-green-400">99.9%</div>
                            <div class="text-gray-400">Uptime</div>
                        </div>
                        <div class="text-center">
                            <div class="text-4xl font-bold text-purple-400">24/7</div>
                            <div class="text-gray-400">Support</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Games Grid -->
        <section class="py-20 bg-gray-800/50">
            <div class="container mx-auto px-4" id="games">
                <h2 class="text-4xl font-bold mb-16 text-center text-white">
                    Choose Your <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Battlefield</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <GameCard v-for="(game, index) in featuredGames" :key="game.id" :game="game" :index="index" />
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
            <div class="container mx-auto px-4 text-center">
                <h2 class="text-4xl font-bold mb-6 text-white">
                    Ready to Dominate?
                </h2>
                <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                    Join thousands of gamers already experiencing lag-free gameplay and instant server setup.
                </p>
                <button @click="scrollToGames"
                    class="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg">
                    Get Started in 60 Seconds
                </button>
            </div>
        </section>

        <!-- <Footer /> -->
    </div>
</template>

<script setup>
definePageMeta({
  auth: false
});
// Featured Games Data
const featuredGames = ref([
    {
        id: 1,
        name: 'Minecraft',
        slug: 'minecraft', // Match this with the route param
        image: '/images/games/minecraft.png',
        description: 'Build, explore, and survive in your own blocky universe',
        minPrice: 2.99,
        features: ['Mod Support', '1-Click Install', 'SSD Storage'],
        soldOut: false
    },
    {
        id: 2,
        name: 'Valheim',
        slug: 'valheim', // Match this with the route param
        image: '/images/games/valheim.png',
        description: 'Conquer the tenth Norse world with your clan',
        minPrice: 7.99,
        features: ['Auto Updates', 'World Backups', 'Dedicated IP'],
        soldOut: true
    },
    {
        id: 3,
        name: 'Rust',
        slug: 'rust', // Match this with the route param
        image: '/images/games/rust.jpg',
        description: 'Survive the ultimate multiplayer survival experience',
        minPrice: 9.99,
        features: ['Wipe Scheduler', 'High Performance', 'Mod Manager'],
        soldOut: true
    },
]);

const scrollToGames = () => {
    const gamesSection = document.querySelector('#games');
    gamesSection.scrollIntoView({ behavior: 'smooth' });
};
</script>

<style>
/* Animations */
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slide-in-right {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
}

.delay-100 {
    animation-delay: 100ms;
}

.delay-200 {
    animation-delay: 200ms;
}

.animate-slide-in-right {
    animation: slide-in-right 0.6s ease-out forwards;
}
</style>