/**
 * `bahrawy-calendar add <component>` — add a specific component.
 */

import { resolve, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import {
  REGISTRY,
  resolveAllDependencies,
  getRequiredPackages,
  getRequiredShadcn,
} from './registry.js';

interface AddOptions {
  dest: string;
  overwrite: boolean;
}

export async function add(component: string, options: AddOptions) {
  const entry = REGISTRY[component];

  if (!entry) {
    console.log('');
    console.log(chalk.red(`  Unknown component: ${component}`));
    console.log('');
    console.log(chalk.dim('  Available components:'));
    for (const [name, reg] of Object.entries(REGISTRY)) {
      console.log(`    ${chalk.bold(name)} — ${reg.description}`);
    }
    console.log('');
    process.exit(1);
  }

  const destDir = resolve(process.cwd(), options.dest);
  const allComponents = resolveAllDependencies([component]);
  const allPackages = getRequiredPackages(allComponents);
  const allShadcn = getRequiredShadcn(allComponents);

  console.log('');
  console.log(chalk.bold(`  Adding: ${component}`));

  if (allComponents.length > 1) {
    console.log(chalk.dim(`  + ${allComponents.length - 1} dependencies`));
  }
  console.log('');

  let copiedCount = 0;

  for (const compName of allComponents) {
    const compEntry = REGISTRY[compName];
    if (!compEntry) continue;

    for (const file of compEntry.files) {
      const destPath = resolve(destDir, file);
      const destFileDir = dirname(destPath);

      if (!existsSync(destFileDir)) {
        mkdirSync(destFileDir, { recursive: true });
      }

      if (existsSync(destPath) && !options.overwrite) {
        console.log(chalk.yellow('  Skipped'), chalk.dim(file));
        continue;
      }

      writeFileSync(destPath, `// ${compEntry.description}\n// Source: https://github.com/bahrawyX/bahrawys-calender/blob/main/src/components/${file}\nexport {};\n`, 'utf-8');
      copiedCount++;
      console.log(chalk.green('  Created'), file);
    }
  }

  console.log('');

  if (allPackages.length > 0) {
    console.log(chalk.bold('  Required packages:'));
    console.log(`  ${chalk.cyan(`npm install ${allPackages.join(' ')}`)}`);
    console.log('');
  }

  if (allShadcn.length > 0) {
    console.log(chalk.bold('  Required shadcn/ui:'));
    console.log(`  ${chalk.cyan(`npx shadcn@latest add ${allShadcn.join(' ')}`)}`);
    console.log('');
  }
}
