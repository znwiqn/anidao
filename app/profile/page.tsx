import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfileForm from "@/components/profile-form"

async function getUserProfile(userId: string) {
  try {
    const userResult = await executeQuery("SELECT id, username, email, telegram_id FROM users WHERE id = $1", [userId])

    if (!userResult.length) {
      return null
    }

    return userResult[0]
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile")
  }

  const user = await getUserProfile(session.user.id)

  if (!user) {
    redirect("/")
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
