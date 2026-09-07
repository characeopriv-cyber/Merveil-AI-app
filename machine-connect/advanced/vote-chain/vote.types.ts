export interface AnonymousVoteReceipt {
  pollId: string;
  nullifierHash: string;
  proofRef: string;
  optionCommitment: string;
  recordedAt: string;
}

/**
 * Civic-poll boundary. This is not an election-grade voting system.
 * Production elections require an independently reviewed election system.
 */
export interface VoteVerificationProvider {
  verifyEligibilityProof(proof: string, pollId: string, nullifierHash: string): Promise<boolean>;
}
