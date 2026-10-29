import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'instruccion@ecema.edu';
  const existing = await prisma.usuario.findUnique({ where: { email } });
  
  if (!existing) {
    const hashedPassword = await bcrypt.hash('instruccion123', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Oficial',
        apellido: 'Instrucción',
        email: email,
        password_hash: hashedPassword,
        rol: 'INSTRUCCION',
      },
    });
    console.log('User created: instruccion@ecema.edu / instruccion123');
  } else {
    console.log('User already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
