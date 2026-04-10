import { Command } from 'commander';
import { MetaClient } from './meta-client';

export const hatchCommand = new Command('hatch')
  .description('Inicia a interface do terminal agente (Hatch Interface)')
  .action(async () => {
    console.log('\n🐣 [Hatch Interface] Iniciando Terminal Agente...');
    console.log('--------------------------------------------------');
    console.log('🤖 Status: Aguardando comandos nativos de IA...');
    
    const isConnected = await MetaClient.ping();
    if (isConnected) {
      console.log('📡 Conexão Meta: Estabelecida com sucesso.');
      const profile = await MetaClient.getProfile();
      if (profile) {
        console.log(`👤 Perfil Vinculado: ${profile.name} (ID: ${profile.id})`);
      }
    } else {
      console.log('📡 Conexão Meta: Falha ao conectar. Verifique suas credenciais.');
    }
    
    // Simulação de loop de agente
    console.log('\n[Agente] "Estou pronto para orquestrar suas contas Meta. O que deseja fazer?"');
    console.log('Sugestão: Use comandos de linguagem natural via "social ai"');
  });
