import { Command } from 'commander';
import { postCommand } from './cli-post';
import { hatchCommand } from './cli-hatch';
import { whatsappCommand } from './cli-whatsapp';

const program = new Command();

program
  .name('cleudocode')
  .description('CLI para automação de redes sociais')
  .version('1.0.0');

program.addCommand(postCommand);
program.addCommand(hatchCommand);
program.addCommand(whatsappCommand);

program.parse(process.argv);
