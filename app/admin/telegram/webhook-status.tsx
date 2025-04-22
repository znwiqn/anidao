"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function WebhookStatusChecker() {
  const [webhookInfo, setWebhookInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchWebhookInfo = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/get-telegram-webhook")
        if (response.ok) {
          const data = await response.json()
          setWebhookInfo(data.result)
        } else {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch webhook info")
        }
      } catch (error: any) {
        console.error("Error fetching webhook info:", error)
        toast({
          title: "Failed to check webhook status",
          description: error.message || "An error occurred while checking the webhook status.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchWebhookInfo()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Status</CardTitle>
        <CardDescription>Check the status of your Telegram bot webhook</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking webhook status...
          </div>
        ) : webhookInfo?.url ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Webhook is set to: <code>{webhookInfo.url}</code>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Webhook is not set.
          </div>
        )}
        {webhookInfo?.last_error_message && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Last Error:</p>
            <p className="text-sm text-red-500">{webhookInfo.last_error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
