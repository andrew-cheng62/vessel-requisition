import { Link, Outlet } from "react-router-dom";


export default function Layout() {
  return (
    <>
      <nav style={{ padding: 12, borderBottom: "1px solid #ccc" }}>
        <Link to="/items">Items</Link>{" "}
        | <Link to="/requisitions">Requisitions</Link>{" "}
        | <Link to="/Companies">Companies</Link>{" "}
        | <Link to="/login">Login</Link>
      </nav>

      <main style={{ padding: 12 }}>
        <Outlet />
      </main>
    </>
  );
}
