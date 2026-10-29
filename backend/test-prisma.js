import { prisma } from './src/prisma.js';

async function checkAreas() {
  const diplomados = await prisma.diplomado.findMany({
    include: {
      areas: {
        include: { materias: true }
      },
      materias: {
        include: { area: true }
      }
    }
  });

  console.log("DCEA test check complete.");
  await prisma.$disconnect();
}

checkAreas().catch(console.error);
