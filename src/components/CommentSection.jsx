// src/components/CommentSection.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function CommentSection({
  comments,
  borrowerId,
  onAddComment,
  onDeleteComment,
}) {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (newComment.trim()) {
      const commentData = {
        borrowerId,
        text: newComment,
        createdAt: new Date(),
      };
      await onAddComment(commentData);
      setNewComment("");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <AddCommentIcon sx={{ mr: 1 }} />
          Comments
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <TextField
          label="Add a new comment"
          variant="outlined"
          multiline
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          Add Comment
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {comments.length > 0 ? (
        <List sx={{ p: 0 }}>
          {comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <ListItem
                disableGutters
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDeleteComment(comment.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={comment.text}
                  secondary={`Added ${dayjs(comment.createdAt.toDate()).fromNow()}`}
                  sx={{ my: 0 }}
                />
              </ListItem>
              {index < comments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="text.secondary">
          No comments found for this borrower.
        </Typography>
      )}
    </Paper>
  );
}