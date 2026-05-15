#!/usr/bin/env node

/**
 * bahrawy-calendar-cli — scaffolding tool for Bahrawy Calendar.
 *
 * Usage:
 *   npx bahrawy-calendar-cli init          # scaffold all components
 *   npx bahrawy-calendar-cli add week-view  # add a single component
 *   npx bahrawy-calendar-cli list           # list available components
 */

import { Command } from 'commander';
import { init } from './init.js';
import { add } from './add.js';
import { list } from './list.js';

const program = new Command();

program
  .name('bahrawy-calendar')
  .description('Scaffold Bahrawy Calendar components into your project')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold all calendar UI components into your project')
  .option('-d, --dest <path>', 'Destination directory', 'components/bahrawy-calendar')
  .option('--overwrite', 'Overwrite existing files', false)
  .action(init);

program
  .command('add <component>')
  .description('Add a specific component (e.g. week-view, month-view, event-modal)')
  .option('-d, --dest <path>', 'Destination directory', 'components/bahrawy-calendar')
  .option('--overwrite', 'Overwrite existing files', false)
  .action(add);

program
  .command('list')
  .description('List all available components')
  .action(list);

program.parse();
