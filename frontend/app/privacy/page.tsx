import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl border-none shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-base text-muted-foreground">
            Learn how LogiTrack collects, uses, and protects your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data Collection</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We collect only the data needed to provide the service and improve your logistics experience.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">How Your Data is Used</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Your personal information is used to manage your account and deliver a secure, reliable service.
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Privacy Controls</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              You can manage your privacy settings and preferences directly from your LogiTrack account.
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
