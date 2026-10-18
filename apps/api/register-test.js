async function run() {
  try {
    const res2 = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companySlug: "test-company",
        email: "admin@example.com",
        password: "Password123!"
      })
    });
    const json2 = await res2.json();
    console.log(json2);
  } catch (e) {
    console.error(e);
  }
}
run();
