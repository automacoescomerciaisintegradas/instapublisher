import { Command } from 'commander';
import { MetaClient } from './meta-client';

export const postCommand = new Command('post')
  .description('Publica conteúdos ou carrosseis diretamente nas perfis de redes sociais (ACI)');

postCommand
  .command('create')
  .description('Cria uma nova publicação no Instagram')
  .option('-m, --message <texto>', 'A legenda descritiva do post (Obrigatório)')
  .option('-u, --urls <urls>', 'URLs das imagens separadas por vírgula (Obrigatório)')
  .action(async (options) => {
    
    if (!process.env.META_CLI_ACCESS_TOKEN || !process.env.META_CLI_IG_USER_ID) {
        console.error('❌ Erro: Env Vars ausentes. Certifique-se de configurar META_CLI_ACCESS_TOKEN e META_CLI_IG_USER_ID.');
        process.exit(1);
    }

    if (!options.urls) {
      console.error('❌ Erro: URLs ausentes. Use a flag --urls "url1, url2".');
      process.exit(1);
    }

    const imageUrls = options.urls.split(',').map((u: string) => u.trim()).filter((u: string) => u.length > 0);

    if (imageUrls.length < 2) {
      console.error('❌ Erro: O carrossel do Instagram precisa de no mínimo 2 imagens.');
      process.exit(1);
    }
    
    if (!options.message) {
      console.error('❌ Erro: Mensagem ausente. Use a flag --message "Sua legenda".');
      process.exit(1);
    }

    console.log('🤖 --- CLEUDOCODE COMMAND CENTER --- 🤖');
    console.log('Orquestrando a publicação via API Graph da Meta...\n');
    console.log(`🖼️ Lendo array de Imagens (${imageUrls.length} arquivos)`);
    console.log(`📝 Processando Formatação Customizada da Legenda\n`);

    try {
      // Inicia a requisição assíncrona pesada
      const result = await MetaClient.publishCarousel(imageUrls, options.message);

      if (result) {
        console.log(`\n🏆 Execução Encerrada pelo Sistema com Sucesso Código 0. ID: ${result}`);
      } else {
        console.error('\n💔 Aborto Crítico. O post não foi publicado. Código 1.');
        process.exit(1);
      }
    } catch (error: any) {
      console.error('\n💔 Aborto Crítico:', error.message);
      process.exit(1);
    }
  });
