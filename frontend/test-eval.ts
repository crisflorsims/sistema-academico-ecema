import axios from 'axios';

async function test() {
  try {
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'evaluador2@gmail.com',
      password: 'password123'
    });
    
    console.log("LOGIN SUCCESS", login.data.usuario.email);
    const token = login.data.token;
    
    const asigs = await axios.get('http://localhost:3000/api/evaluadores/asignaciones', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("ASIGS LENGTH", asigs.data.length);
    const misAsignaciones = asigs.data.filter((a: any) => a.evaluador_id === login.data.usuario.id);
    console.log("MIS ASIGNACIONES", misAsignaciones.map((a: any) => a.edicion?.diplomado?.nombre));
    
  } catch(e: any) {
    console.error("ERROR", e.response?.data || e.message);
  }
}
test();
