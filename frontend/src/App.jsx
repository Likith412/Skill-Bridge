import { useEffect } from "react";

function App() {
  const getData = async () => {
    const response = await fetch("/api", { method: "GET" });
    const { message } = await response.json();
    console.log(message);
  };

  useEffect(() => {
    getData();
  }, []);

  return null;
}

export default App;
