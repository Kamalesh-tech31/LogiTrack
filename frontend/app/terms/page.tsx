import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl border-none shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-base text-muted-foreground">
            Review the terms and conditions for using LogiTrack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Welcome to LogiTrack. These Terms of Service govern your access to and use of our platform.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Use of the Service</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              You agree to use LogiTrack responsibly, keep your account secure, and comply with applicable laws.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Account Security</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Protect your credentials and inform us if your account is compromised.
            </p>
          </section>
          <div className="flex justify-end">
            <Link href="/register">
              <Button>Back to Register</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
