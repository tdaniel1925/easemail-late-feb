import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome to EaseMail v3.0
        </h1>
        <p className="text-base text-text-secondary">
          Professional email client with AI features
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent-hover transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-tertiary transition-colors font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
