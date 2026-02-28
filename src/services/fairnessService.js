/**
 * fairnessService.js - Verifiable Random Winner Selection
 * 
 * PURPOSE:
 * Implements cryptographically secure and verifiable winner selection
 * using pre-commit seeds and HMAC-SHA256 for transparency.
 * 
 * FAIRNESS PROOF SYSTEM:
 * - Pre-commit server seed (published hash on giveaway page)
 * - HMAC_SHA256(seed, payment_intent_id || entry_id) → uniform index
 * - Store seed + proof for "View fairness proof" modal
 * - Immutable audit trail for transparency
 */

import CryptoJS from 'crypto-js';
import { supabase } from '../config/supabase';

export const fairnessService = {

  /**
   * Generate and store pre-commit seed for giveaway
   */
  async generateGiveawaySeed(giveawayId, creatorId) {
    try {
      // Generate cryptographically secure random seed
      const seed = CryptoJS.lib.WordArray.random(256/8).toString(); // 256-bit seed
      const seedHash = CryptoJS.SHA256(seed).toString();
      
      // Store seed commitment in database
      const { data, error } = await supabase
        .from('giveaway_seeds')
        .insert({
          giveaway_id: giveawayId,
          creator_id: creatorId,
          seed_hash: seedHash, // Public commitment
          seed_value: seed,    // Private until reveal
          committed_at: new Date().toISOString(),
          revealed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Seed generation error:', error);
        return { data: null, error };
      }

      return { 
        data: { 
          seedHash, 
          seedId: data.id 
        }, 
        error: null 
      };

    } catch (error) {
      console.error('Fairness service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get public seed hash for giveaway (displayed on giveaway page)
   */
  async getGiveawaySeedHash(giveawayId) {
    try {
      const { data, error } = await supabase
        .from('giveaway_seeds')
        .select('seed_hash, committed_at')
        .eq('giveaway_id', giveawayId)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Verifiable random winner selection
   */
  async selectVerifiableWinner(giveawayId) {
    try {
      // Get all valid entries
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          user_id,
          payment_id,
          order_id,
          created_at,
          user:profiles(username, name, avatar_url)
        `)
        .eq('giveaway_id', giveawayId)
        .eq('payment_status', 'completed')
        .order('created_at');

      if (entriesError || !entries.length) {
        return { data: null, error: { message: 'No valid entries found' } };
      }

      // Get giveaway seed
      const { data: seedData, error: seedError } = await supabase
        .from('giveaway_seeds')
        .select('*')
        .eq('giveaway_id', giveawayId)
        .single();

      if (seedError || !seedData) {
        return { data: null, error: { message: 'Giveaway seed not found' } };
      }

      // Create deterministic input for each entry
      const entryInputs = entries.map(entry => {
        // Use payment_intent_id or entry_id as deterministic input
        return entry.payment_id || entry.order_id || entry.id;
      });

      // Calculate HMAC for each entry
      const entryHashes = entryInputs.map((input, index) => {
        const hmac = CryptoJS.HmacSHA256(input, seedData.seed_value);
        const hashValue = hmac.toString();
        
        // Convert to numeric value for uniform distribution
        const hashInt = parseInt(hashValue.substring(0, 16), 16);
        
        return {
          entryIndex: index,
          entry: entries[index],
          input: input,
          hash: hashValue,
          normalizedValue: hashInt,
          proof: {
            seed_hash: seedData.seed_hash,
            entry_input: input,
            hmac_output: hashValue,
            calculation: `HMAC_SHA256("${input}", seed) = ${hashValue}`
          }
        };
      });

      // Find winner with highest normalized hash value
      const winner = entryHashes.reduce((max, current) => 
        current.normalizedValue > max.normalizedValue ? current : max
      );

      // Reveal seed and store proof
      const { error: revealError } = await supabase
        .from('giveaway_seeds')
        .update({
          revealed: true,
          revealed_at: new Date().toISOString()
        })
        .eq('id', seedData.id);

      // Store fairness proof
      const fairnessProof = {
        giveaway_id: giveawayId,
        winner_entry_id: winner.entry.id,
        winner_user_id: winner.entry.user_id,
        seed_id: seedData.id,
        seed_value: seedData.seed_value,
        seed_hash: seedData.seed_hash,
        total_entries: entries.length,
        winner_input: winner.input,
        winner_hash: winner.hash,
        all_calculations: entryHashes.map(h => h.proof),
        selection_method: 'HMAC_SHA256_MAX',
        verified_at: new Date().toISOString()
      };

      const { error: proofError } = await supabase
        .from('fairness_proofs')
        .insert(fairnessProof);

      if (proofError) {
        console.error('Failed to store fairness proof:', proofError);
      }

      // Update giveaway with winner
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          winner_id: winner.entry.user_id,
          winner_selected_at: new Date().toISOString(),
          status: 'ended',
          fairness_proof_id: fairnessProof.id
        })
        .eq('id', giveawayId);

      return { 
        data: {
          winner: winner.entry,
          proof: fairnessProof,
          totalEntries: entries.length
        }, 
        error: null 
      };

    } catch (error) {
      console.error('Verifiable winner selection error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get fairness proof for completed giveaway
   */
  async getFairnessProof(giveawayId) {
    try {
      const { data, error } = await supabase
        .from('fairness_proofs')
        .select(`
          *,
          giveaway:giveaways(title, end_date),
          winner:profiles(username, name)
        `)
        .eq('giveaway_id', giveawayId)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Verify fairness proof independently
   */
  verifyFairnessProof(proof) {
    try {
      // Recreate HMAC calculation
      const calculatedHmac = CryptoJS.HmacSHA256(proof.winner_input, proof.seed_value).toString();
      
      // Verify seed hash
      const calculatedSeedHash = CryptoJS.SHA256(proof.seed_value).toString();
      
      const isValid = 
        calculatedHmac === proof.winner_hash &&
        calculatedSeedHash === proof.seed_hash;

      return {
        isValid,
        calculatedHmac,
        calculatedSeedHash,
        providedHmac: proof.winner_hash,
        providedSeedHash: proof.seed_hash
      };
    } catch (error) {
      console.error('Proof verification error:', error);
      return { isValid: false, error };
    }
  }
};

export default fairnessService;
