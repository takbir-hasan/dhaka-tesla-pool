import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <div className="home-content">
        <h1>Dhaka Tesla Pool</h1>

        <p>
          Smart ride pooling for
          everyday travel in Dhaka.
        </p>

        <div className="home-actions">
          <Link
            className="primary-button"
            href="/login"
          >
            Login
          </Link>

          <Link
            className="secondary-button"
            href="/register"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
