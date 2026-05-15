/**
 * `bahrawy-calendar list` — list all available components.
 */

import chalk from 'chalk';
import { REGISTRY } from './registry.js';

export async function list() {
  console.log('');
  console.log(chalk.bold('  Available Bahrawy Calendar Components'));
  console.log('');

  // Group: Core
  console.log(chalk.dim('  Core'));
  printEntry('bahrawy-calendar');

  // Group: Views
  console.log('');
  console.log(chalk.dim('  Views'));
  printEntry('week-view');
  printEntry('month-view');
  printEntry('day-view');

  // Group: Event components
  console.log('');
  console.log(chalk.dim('  Event components'));
  printEntry('time-grid-event');
  printEntry('event-item');
  printEntry('event-modal');
  printEntry('event-provider-badge');

  // Group: Interaction
  console.log('');
  console.log(chalk.dim('  Interaction'));
  printEntry('time-slot-cell');
  printEntry('drag-ghost');
  printEntry('hover-indicator');
  printEntry('conflict-dialog');
  printEntry('conflict-sheet');

  // Group: Utilities
  console.log('');
  console.log(chalk.dim('  Utilities'));
  printEntry('calendar-shared');
  printEntry('virtualization');
  printEntry('day-timeline');
  printEntry('recurrence-selector');
  printEntry('date-picker');
  printEntry('time-picker');
  printEntry('icons');

  console.log('');
  console.log(chalk.dim('  Usage: npx bahrawy-calendar-cli add <component>'));
  console.log('');
}

function printEntry(name: string) {
  const entry = REGISTRY[name];
  if (!entry) return;
  const deps = entry.dependencies.length > 0
    ? chalk.dim(` (depends: ${entry.dependencies.join(', ')})`)
    : '';
  console.log(`    ${chalk.bold(name)} — ${entry.description}${deps}`);
}
