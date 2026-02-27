-- Posts table for gym community feed
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post likes (one per user per post)
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_gym_id ON posts(gym_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Posts: gym members can see posts from their gym
CREATE POLICY "Gym members can view posts"
  ON posts FOR SELECT
  USING (
    gym_id IN (
      SELECT p.gym_id FROM profiles p WHERE p.id = auth.uid() AND p.gym_id IS NOT NULL
    )
  );

-- Posts: users can insert their own posts
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Posts: users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Posts: users can update their own posts (for like count updates)
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow any gym member to update likes_count via function
CREATE POLICY "Gym members can update post likes count"
  ON posts FOR UPDATE
  USING (
    gym_id IN (
      SELECT p.gym_id FROM profiles p WHERE p.id = auth.uid() AND p.gym_id IS NOT NULL
    )
  );

-- Post likes: gym members can see likes
CREATE POLICY "Gym members can view likes"
  ON post_likes FOR SELECT
  USING (
    post_id IN (
      SELECT po.id FROM posts po
      JOIN profiles pr ON pr.gym_id = po.gym_id
      WHERE pr.id = auth.uid()
    )
  );

-- Post likes: users can like
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Post likes: users can unlike
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);
