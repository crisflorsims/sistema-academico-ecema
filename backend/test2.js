const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.usuario.findUnique({where:{email:'evaluador2@gmail.com'}});
  if(!user) return console.log('No user evaluador2@gmail.com');
  
  const asigs = await prisma.evaluadorMateria.findMany({
    where:{evaluador_id: user.id}, 
    include:{edicion:{include:{diplomado:true}}}
  });
  console.log("Asignaciones:", JSON.stringify(asigs, null, 2));
}

run();
