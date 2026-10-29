import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const insc = await prisma.inscripcion.findMany({ include: { edicion: { include: { diplomado: true, periodo: true } } } });
  console.log(JSON.stringify(insc, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
