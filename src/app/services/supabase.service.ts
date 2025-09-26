import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Đơn giản hóa interfaces - chỉ cần những gì cần thiết
export interface RosterRecord {
  id?: number;
  cccd: string;
  hoten: string;
  mssv?: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id?: number;
  cccd: string;
  time: string;
  created_at?: string;
  roster?: RosterRecord;
}

export interface Candidate {
  id?: number;
  name: string;
  position: string;
  description: string;
  active: boolean;
  image_url?: string; // URL của ảnh từ Supabase Storage
  created_at?: string;
}

export interface Vote {
  id?: number;
  cccd: string;
  candidate: string;
  voted_at: string;
  created_at?: string;
  roster?: RosterRecord;
}

export interface ElectionStatus {
  id?: number;
  status: 'active' | 'ended' | 'results_published';
  ended_at?: string | null;
  results_published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  // Roster operations - Đơn giản hóa
  async getRoster(): Promise<RosterRecord[]> {
    const { data, error } = await this.supabase
      .from('roster')
      .select('*')
      .order('hoten');
    
    if (error) {
      console.error('Error getting roster:', error);
      return [];
    }
    return data || [];
  }

  async addRosterMember(member: Omit<RosterRecord, 'id'>): Promise<RosterRecord> {
    const { data, error } = await this.supabase
      .from('roster')
      .insert([member])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding roster member:', error);
      throw error;
    }
    return data;
  }

  async getRosterByCCCD(cccd: string): Promise<RosterRecord | null> {
    const { data, error } = await this.supabase
      .from('roster')
      .select('*')
      .eq('cccd', cccd)
      .single();
    
    if (error) {
      console.error('Error getting roster by CCCD:', error);
      return null;
    }
    return data;
  }

  async searchRoster(query: string): Promise<RosterRecord[]> {
    const { data, error } = await this.supabase
      .from('roster')
      .select('*')
      .or(`cccd.ilike.%${query}%,hoten.ilike.%${query}%,mssv.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching roster:', error);
      return [];
    }
    return data || [];
  }

  // Attendance operations - Đơn giản hóa
  async checkAttendance(cccd: string): Promise<AttendanceRecord | null> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select('*')
      .eq('cccd', cccd)
      .single();
    
    if (error) {
      console.error('Error checking attendance:', error);
      return null;
    }
    return data;
  }

  async markAttendance(cccd: string): Promise<AttendanceRecord> {
    const { data, error } = await this.supabase
      .from('attendance')
      .insert({ cccd })
      .select()
      .single();
    
    if (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
    return data;
  }

  async getAttendanceList(): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase
      .from('attendance')
      .select(`
        *,
        roster:cccd (hoten, mssv)
      `)
      .order('time', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance list:', error);
      return [];
    }
    return data || [];
  }

  // Voting operations - Đơn giản hóa (không cần voting codes)
  async submitVote(cccd: string, candidate: string): Promise<Vote> {
    const { data, error } = await this.supabase
      .from('votes')
      .insert({ 
        cccd, 
        candidate, 
        voted_at: new Date().toISOString() 
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
    return data;
  }

  async getVotes(): Promise<Vote[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('*')
      .order('voted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching votes:', error);
      throw error;
    }
    return data || [];
  }

  async getVotingResults(): Promise<Vote[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select(`
        *,
        roster:cccd (hoten, mssv)
      `)
      .order('voted_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching voting results:', error);
      return [];
    }
    return data || [];
  }

  async getVotingStats(): Promise<any> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('candidate');
    
    if (error) {
      console.error('Error fetching voting stats:', error);
      return {};
    }
    
    const stats = data?.reduce((acc: any, vote: any) => {
      acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return stats;
  }

  // Candidates operations
  async getCandidates(): Promise<Candidate[]> {
    const { data, error } = await this.supabase
      .from('candidates')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error getting candidates:', error);
      return [];
    }
    return data || [];
  }

  async addCandidate(candidate: Omit<Candidate, 'id' | 'created_at'>): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding candidate:', error);
      throw error;
    }
    return data;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const { data, error } = await this.supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
    return data;
  }

  async deleteCandidate(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('candidates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  }

  // Image upload methods
  async uploadCandidateImage(file: File, candidateId: number): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `candidate_${candidateId}_${Date.now()}.${fileExt}`;
    const filePath = `candidates/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('anh_ung_vien')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('anh_ung_vien')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async deleteCandidateImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `candidates/${fileName}`;

      const { error } = await this.supabase.storage
        .from('anh_ung_vien')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        // Don't throw error for image deletion failures
      }
    } catch (error) {
      console.error('Error processing image deletion:', error);
      // Don't throw error for image deletion failures
    }
  }

  // Election Status operations
  async getElectionStatus(): Promise<ElectionStatus> {
    const { data, error } = await this.supabase
      .from('election_status')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      console.error('Error fetching election status:', error);
      // Return default status if not found
      return {
        id: 1,
        status: 'active',
        ended_at: null,
        results_published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return data;
  }

  async updateElectionStatus(status: 'active' | 'ended' | 'results_published'): Promise<ElectionStatus> {
    const updateData: any = { status };
    
    if (status === 'ended') {
      updateData.ended_at = new Date().toISOString();
    } else if (status === 'results_published') {
      updateData.results_published_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('election_status')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating election status:', error);
      throw error;
    }
    return data;
  }

  async getElectionResults(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('candidate');
    
    if (error) {
      console.error('Error fetching election results:', error);
      throw error;
    }

    // Group votes by candidate
    const voteCounts: { [key: string]: number } = {};
    data?.forEach((vote: any) => {
      voteCounts[vote.candidate] = (voteCounts[vote.candidate] || 0) + 1;
    });

    // Convert to array and sort by vote count
    const results = Object.entries(voteCounts)
      .map(([candidate, votes]) => ({
        candidate,
        votes,
        percentage: data?.length > 0 ? (votes / data.length * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.votes - a.votes);

    return results;
  }

  // Voting code generation has been removed - using CCCD directly

  // Helper method to reset election status to active
  private async resetElectionStatusToActive(): Promise<void> {
    try {
      // First, try to update existing record
      const { error: updateError } = await this.supabase
        .from('election_status')
        .update({
          status: 'active',
          ended_at: null,
          results_published_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (updateError) {
        console.log('⚠️ Update failed, trying to insert new record...');
        // If update fails, insert a new record
        const { error: insertError } = await this.supabase
          .from('election_status')
          .insert({
            id: 1,
            status: 'active',
            ended_at: null,
            results_published_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error inserting election status:', insertError);
        } else {
          console.log('✅ Election status inserted as active');
        }
      } else {
        console.log('✅ Election status updated to active');
      }
    } catch (error: any) {
      console.error('❌ Error resetting election status:', error);
    }
  }

  // Reset Election Status to Active (Public method for admin)
  async resetElectionStatus(): Promise<{ success: boolean; message: string }> {
    try {
      await this.resetElectionStatusToActive();
      return {
        success: true,
        message: 'Đã reset trạng thái cuộc bầu cử về "Đang diễn ra"!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi reset trạng thái cuộc bầu cử: ${error.message}`
      };
    }
  }

  // Reset Data Operations - Xóa toàn bộ dữ liệu để tổ chức lại sự kiện
  async resetAllData(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 Starting complete data reset...');
      
      // Get counts before deletion for reporting
      const [rosterCount, attendanceCount, votesCount, candidatesCount] = await Promise.all([
        this.supabase.from('roster').select('*', { count: 'exact', head: true }),
        this.supabase.from('attendance').select('*', { count: 'exact', head: true }),
        this.supabase.from('votes').select('*', { count: 'exact', head: true }),
        this.supabase.from('candidates').select('*', { count: 'exact', head: true })
      ]);

      const beforeCounts = {
        roster: rosterCount.count || 0,
        attendance: attendanceCount.count || 0,
        votes: votesCount.count || 0,
        candidates: candidatesCount.count || 0
      };

      console.log('📊 Data counts before reset:', beforeCounts);

      // Delete in correct order to respect foreign key constraints
      // Use TRUNCATE approach for better performance and to avoid FK issues
      
      // 1. Delete votes first (references roster)
      console.log('🗑️ Deleting votes...');
      const { error: votesError } = await this.supabase
        .from('votes')
        .delete()
        .gte('created_at', '1900-01-01'); // Delete all votes using a condition that's always true

      if (votesError) {
        console.error('❌ Error deleting votes:', votesError);
        throw new Error(`Lỗi xóa phiếu bầu: ${votesError.message}`);
      }

      // 2. Delete attendance (references roster)
      console.log('🗑️ Deleting attendance...');
      const { error: attendanceError } = await this.supabase
        .from('attendance')
        .delete()
        .gte('time', '1900-01-01'); // Delete all attendance using a condition that's always true

      if (attendanceError) {
        console.error('❌ Error deleting attendance:', attendanceError);
        throw new Error(`Lỗi xóa điểm danh: ${attendanceError.message}`);
      }

      // 3. Codes table has been removed - no longer needed

      // 4. Delete candidates (no foreign key dependencies)
      console.log('🗑️ Deleting candidates...');
      const { error: candidatesError } = await this.supabase
        .from('candidates')
        .delete()
        .gte('created_at', '1900-01-01'); // Delete all candidates using a condition that's always true

      if (candidatesError) {
        console.error('❌ Error deleting candidates:', candidatesError);
        throw new Error(`Lỗi xóa ứng cử viên: ${candidatesError.message}`);
      }

      // 5. Delete roster (primary table) - must be last
      console.log('🗑️ Deleting roster...');
      const { error: rosterError } = await this.supabase
        .from('roster')
        .delete()
        .neq('cccd', ''); // Delete all records

      if (rosterError) {
        console.error('❌ Error deleting roster:', rosterError);
        throw new Error(`Lỗi xóa danh sách cử tri: ${rosterError.message}`);
      }

      // 6. Reset election status to active
      console.log('🔄 Resetting election status...');
      await this.resetElectionStatusToActive();

      // Verify deletion
      const [finalRosterCount, finalAttendanceCount, finalVotesCount, finalCandidatesCount] = await Promise.all([
        this.supabase.from('roster').select('*', { count: 'exact', head: true }),
        this.supabase.from('attendance').select('*', { count: 'exact', head: true }),
        this.supabase.from('votes').select('*', { count: 'exact', head: true }),
        this.supabase.from('candidates').select('*', { count: 'exact', head: true })
      ]);

      const afterCounts = {
        roster: finalRosterCount.count || 0,
        attendance: finalAttendanceCount.count || 0,
        votes: finalVotesCount.count || 0,
        candidates: finalCandidatesCount.count || 0
      };

      console.log('📊 Data counts after reset:', afterCounts);

      // Check if all data is cleared
      const totalRemaining = afterCounts.roster + afterCounts.attendance + afterCounts.votes + afterCounts.candidates;
      
      if (totalRemaining === 0) {
        console.log('✅ Data reset completed successfully!');
        return {
          success: true,
          message: 'Đã xóa toàn bộ dữ liệu thành công! Hệ thống đã được reset để tổ chức sự kiện mới.',
          details: {
            deleted: beforeCounts,
            remaining: afterCounts,
            resetTime: new Date().toISOString()
          }
        };
      } else {
        console.log('⚠️ Some data still remains:', afterCounts);
        return {
          success: true,
          message: `Đã xóa phần lớn dữ liệu thành công! Còn lại ${totalRemaining} bản ghi.`,
          details: {
            deleted: beforeCounts,
            remaining: afterCounts,
            resetTime: new Date().toISOString()
          }
        };
      }

    } catch (error: any) {
      console.error('❌ Data reset failed:', error);
      return {
        success: false,
        message: `Lỗi reset dữ liệu: ${error.message}`,
        details: {
          error: error.message,
          resetTime: new Date().toISOString()
        }
      };
    }
  }

  // Reset specific data types
  async resetAttendanceData(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('attendance')
        .delete()
        .gte('time', '1900-01-01');

      if (error) throw error;

      return {
        success: true,
        message: 'Đã xóa toàn bộ dữ liệu điểm danh!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi xóa dữ liệu điểm danh: ${error.message}`
      };
    }
  }

  async resetVotingData(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('votes')
        .delete()
        .gte('created_at', '1900-01-01');

      if (error) throw error;

      return {
        success: true,
        message: 'Đã xóa toàn bộ dữ liệu bầu cử!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi xóa dữ liệu bầu cử: ${error.message}`
      };
    }
  }

  async resetCandidatesData(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('candidates')
        .delete()
        .gte('created_at', '1900-01-01');

      if (error) throw error;

      return {
        success: true,
        message: 'Đã xóa toàn bộ dữ liệu ứng cử viên!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi xóa dữ liệu ứng cử viên: ${error.message}`
      };
    }
  }

  async resetRosterData(): Promise<{ success: boolean; message: string }> {
    try {
      // Delete dependent data first in correct order
      await this.resetVotingData();
      await this.resetAttendanceData();
      
      // Codes table has been removed - no longer needed

      // Finally delete roster
      const { error } = await this.supabase
        .from('roster')
        .delete()
        .neq('cccd', '');

      if (error) throw error;

      // Reset election status to active
      await this.resetElectionStatusToActive();

      return {
        success: true,
        message: 'Đã xóa toàn bộ dữ liệu cử tri và reset trạng thái cuộc bầu cử!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi xóa dữ liệu cử tri: ${error.message}`
      };
    }
  }
}