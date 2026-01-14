-- V13: Add template and approval fields to tournament table
ALTER TABLE tournament 
ADD COLUMN template_id BIGINT REFERENCES tournament_template(template_id),
ADD COLUMN approval_status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN approved_by BIGINT REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP;

-- Create indexes for efficient querying
CREATE INDEX idx_tournament_template ON tournament(template_id);
CREATE INDEX idx_tournament_approval_status ON tournament(approval_status);
CREATE INDEX idx_tournament_club_status ON tournament(club_id, approval_status);

-- Update existing tournaments to have APPROVED status if they have a club
UPDATE tournament 
SET approval_status = 'APPROVED' 
WHERE club_id IS NOT NULL AND status != 'DRAFT';
