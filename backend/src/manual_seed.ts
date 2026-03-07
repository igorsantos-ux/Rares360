import { SeedService } from './services/SeedService.js';

async function manualSeed() {
    try {
        console.log('--- Iniciando Seed Manual no Supabase ---');
        await SeedService.autoSeedIfEmpty();
        console.log('--- Seed Concluído! ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro no seed manual:', error);
        process.exit(1);
    }
}

manualSeed();
