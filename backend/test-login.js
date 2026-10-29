fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "windel.quispe@ecema.bo", password: "password" })
}).then(res => res.text().then(text => console.log(res.status, res.headers, text))).catch(console.error);
