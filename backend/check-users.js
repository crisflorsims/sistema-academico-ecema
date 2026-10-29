import { prisma } from './dist/prisma.js';
prisma.usuario.findMany().then(users => {
    console.log("Users in DB:", users.length);
    if(users.length > 0) {
        console.log("First user email:", users[0].email, "role:", users[0].rol);
    }
}).catch(console.error).finally(() => prisma.$disconnect());
