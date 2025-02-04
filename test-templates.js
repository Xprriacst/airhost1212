const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'src/scripts/test-whatsapp-templates.ts');

const tsNode = spawn('npx', ['ts-node', scriptPath], {
  stdio: 'inherit',
  shell: true
});

tsNode.on('error', (error) => {
  console.error('Erreur lors de l\'exécution du script:', error);
  process.exit(1);
});
