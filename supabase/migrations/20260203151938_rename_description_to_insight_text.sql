/*
  # Rename description column to insight_text
  
  ## Changes
  - Rename `description` column to `insight_text` in ai_insights table
  
  ## Reason
  This aligns the column name with the production schema requirements
  where AI-generated insights are stored in `insight_text` field.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_insights' AND column_name = 'description'
  ) THEN
    ALTER TABLE ai_insights RENAME COLUMN description TO insight_text;
  END IF;
END $$;