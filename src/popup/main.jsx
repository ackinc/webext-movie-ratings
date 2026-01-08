import { render, h, Fragment } from "preact";

const root = document.querySelector("div#root");
render(<App />, root);

function App() {
  return <div>Opt-in to telemetry?</div>;
}
