const axios = require('axios');

async function check() {
  console.time('login');
  const res = await axios.post('http://localhost:3000/api/auth/login', {
    email: 'admin@ecema.edu',
    password: 'admin123'
  });
  console.timeEnd('login');
  
  const token = res.data.token;
  
  console.time('docentes');
  await axios.get('http://localhost:3000/api/docentes/asignaciones', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.timeEnd('docentes');

  console.time('reportes');
  await axios.get('http://localhost:3000/api/reportes/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.timeEnd('reportes');
  
  console.time('diplomas');
  await axios.get('http://localhost:3000/api/diplomas', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.timeEnd('diplomas');
}

check().catch(console.error);
