import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <h1 className="title">Welcome to EcoBridge</h1>
      <nav className="nav">
        <Link href="/" legacyBehavior>
          <button>Home</button>
        </Link>
        <Link href="/about-us" legacyBehavior>
          <button>About Us</button>
        </Link>
        <Link href="/news" legacyBehavior>
          <button>News</button>
        </Link>
      </nav>
    </div>
  );
}
