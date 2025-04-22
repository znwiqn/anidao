import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Film, Users, MessageSquare, Star, Heart, Clock, Settings } from "lucide-react"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    redirect("/")
  }

  const adminCards = [
    {
      title: "Manage Anime",
      description: "Add, edit, or delete anime series",
      icon: <Film className="h-8 w-8" />,
      href: "/admin/anime",
    },
    {
      title: "Manage Episodes",
      description: "Add, edit, or delete episodes",
      icon: <Film className="h-8 w-8" />,
      href: "/admin/episodes",
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: <Users className="h-8 w-8" />,
      href: "/admin/users",
    },
    {
      title: "Comments",
      description: "Moderate user comments",
      icon: <MessageSquare className="h-8 w-8" />,
      href: "/admin/comments",
    },
    {
      title: "Ratings",
      description: "View anime ratings",
      icon: <Star className="h-8 w-8" />,
      href: "/admin/ratings",
    },
    {
      title: "Favorites",
      description: "View user favorites",
      icon: <Heart className="h-8 w-8" />,
      href: "/admin/favorites",
    },
    {
      title: "Watch History",
      description: "View user watch history",
      icon: <Clock className="h-8 w-8" />,
      href: "/admin/history",
    },
    {
      title: "Telegram Bot",
      description: "Configure Telegram bot settings",
      icon: <Settings className="h-8 w-8" />,
      href: "/admin/telegram",
    },
  ]

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Neon PostgreSQL</div>
            <p className="text-xs text-muted-foreground">Connected</p>
          </CardContent>
        </Card>

        {adminCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <Link href={card.href} className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
                <Button variant="link" className="p-0 h-auto mt-2">
                  Manage
                </Button>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
