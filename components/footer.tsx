import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">ANI DAO</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} ANI DAO. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary">
            About
          </Link>
          <Link href="/terms" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Privacy
          </Link>
          <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
