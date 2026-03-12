// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  return <div className="app">Placeholder</div>;
}
