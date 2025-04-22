"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Clipboard, Check } from "lucide-react"
import WebhookStatusChecker from "./webhook-status"
import TestMessageSender from "./test-message"

export default function TelegramBotPage() {
  const [botUsername, setBotUsername] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Set the webhook URL based on the current hostname
    const host = window.location.origin
    setWebhookUrl(`${host}/api/telegram-webhook`)
  }, [])

  const handleSetWebhook = async () => {
    setIsSettingWebhook(true)

    try {
      const response = await fetch("/api/admin/set-telegram-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
        }),
      })

      if (response.ok) {
        toast({
          title: "Webhook set",
          description: "The Telegram bot webhook has been set successfully.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to set webhook")
      }
    } catch (error: any) {
      console.error("Error setting webhook:", error)
      toast({
        title: "Webhook setup failed",
        description: error.message || "An error occurred while setting the webhook.",
        variant: "destructive",
      })
    } finally {
      setIsSettingWebhook(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Telegram Bot Configuration</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Bot Information</CardTitle>
            <CardDescription>Details about your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <div className="text-sm text-muted-foreground">
                Your bot token is securely stored as an environment variable.
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-username">Bot Username</Label>
              <Input
                id="bot-username"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value)}
                placeholder="@your_bot_username"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Set up the webhook for your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex">
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="rounded-r-none"
                />
                <Button type="button" variant="outline" className="rounded-l-none" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the URL that Telegram will send updates to. Make sure your server is publicly accessible.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSetWebhook} disabled={isSettingWebhook}>
              {isSettingWebhook ? "Setting Webhook..." : "Set Webhook"}
            </Button>
          </CardFooter>
        </Card>

        <WebhookStatusChecker />

        <TestMessageSender />

        <Card>
          <CardHeader>
            <CardTitle>Bot Commands</CardTitle>
            <CardDescription>Available commands for your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <code>/start</code> - Start the bot
              </li>
              <li>
                <code>/help</code> - Show help message
              </li>
              <li>
                <code>/addanime</code> - Add a new anime (admin only)
              </li>
              <li>
                <code>/addepisode</code> - Add a new episode (admin only)
              </li>
              <li>
                <code>/listanime</code> - List all anime
              </li>
              <li>
                <code>/status</code> - Check your admin status
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
