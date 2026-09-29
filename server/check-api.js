async function test() {
  try {
    const res = await fetch('http://localhost:5001/api/posts');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
