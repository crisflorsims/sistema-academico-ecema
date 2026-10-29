import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@instituto.edu' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'ECEMA',
      email: 'admin@instituto.edu',
      password_hash: hashedPassword,
      rol: 'ADMIN',
    },
  });

  console.log('Seeded Admin User:', admin.email, '- Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
