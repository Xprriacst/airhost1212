import bcrypt from 'bcryptjs';

async function generatePassword() {
  const password = 'admin123'; // Mot de passe initial pour l'admin
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Mot de passe hashé:', hash);
}

generatePassword();
