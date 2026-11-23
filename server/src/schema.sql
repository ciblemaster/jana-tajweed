-- Jana Tajweed: grown-ups' accounts and their children's progress. Safe to run again.
-- We keep the least we can: a grown-up's email and password hash, and for each child a first name or nickname,
-- an animal, an age group and their game progress. No voice recordings, no birth dates, nothing else.

CREATE TABLE IF NOT EXISTS parents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  password    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS parents_email ON parents (lower(email));

-- A child keeps the id their first device gave them; ids are only unique within one family.
CREATE TABLE IF NOT EXISTS children (
  parent_id   uuid NOT NULL REFERENCES parents (id) ON DELETE CASCADE,
  id          text NOT NULL,
  name        text NOT NULL,
  avatar      text NOT NULL,
  band        text NOT NULL,
  progress    jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- Set when a grown-up removes the child, so another device does not bring them back.
  deleted_at  timestamptz,
  PRIMARY KEY (parent_id, id)
);
