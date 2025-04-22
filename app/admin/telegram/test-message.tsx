"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function TestMessageSender() {
  const [chatId, setChatId] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const sendTestMessage = async () => {
    if (!chatId) {
      toast({
        title: "Chat ID required",
        description: "Please enter your Telegram Chat ID to send a test message.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/admin/test-telegram-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Test message sent",
          description: "A test message has been sent to your Telegram account.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to send test message")
      }
    } catch (error: any) {
      console.error("Error sending test message:", error)
      toast({
        title: "Message sending failed",
        description: error.message || "An error occurred while sending the test message.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Connection</CardTitle>
        <CardDescription>Send a test message to verify your Telegram bot connection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chat-id">Your Telegram Chat ID</Label>
          <Input
            id="chat-id"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Your Telegram Chat ID"
          />
          <p className="text-xs text-muted-foreground">
            This is your personal Telegram ID. You can get it by sending /status to your bot.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={sendTestMessage} disabled={isSending} className="w-full">
          {isSending ? "Sending..." : "Send Test Message"}
        </Button>
      </CardFooter>
    </Card>
  )
}
