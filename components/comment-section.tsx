"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: number
  user_id: number
  content: string
  created_at: string
  username: string
}

interface CommentSectionProps {
  comments: Comment[]
  animeId: number | string
  episodeId?: number | string
}

export default function CommentSection({ comments: initialComments, animeId, episodeId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>(initialComments || [])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a comment.",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animeId,
          episodeId: episodeId || null,
          content: newComment,
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments([newCommentData, ...comments])
        setNewComment("")
        toast({
          title: "Comment posted",
          description: "Your comment has been posted successfully.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to post comment")
      }
    } catch (error: any) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting || !session}
          className="min-h-[100px]"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !session}>
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-lg border">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{comment.username}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                <p className="mt-2 text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
}
