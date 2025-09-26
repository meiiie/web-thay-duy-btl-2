import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Vote, Candidate } from '../../services/supabase.service';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.html',
  styleUrls: ['./voting.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class VotingComponent implements OnInit {
  votingCode: string = '';
  isValidatingCode = false;
  validationResult: { success: boolean, message: string, data?: any } | null = null;
  candidates: Candidate[] = [];
  selectedCandidate: string = '';
  isSubmittingVote = false;
  voteResult: { success: boolean, message: string } | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadCandidates();
  }

  async loadCandidates() {
    try {
      this.candidates = await this.supabase.getCandidates();
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      // Fallback to empty array if database fails
      this.candidates = [];
    }
  }

  async validateVotingCode() {
    if (!this.votingCode.trim()) {
      this.validationResult = {
        success: false,
        message: 'Vui lòng nhập số CCCD'
      };
      return;
    }

    this.isValidatingCode = true;
    this.validationResult = null;

    try {
      // Kiểm tra CCCD có trong roster không
      const rosterData = await this.supabase.getRosterByCCCD(this.votingCode.trim());
      
      if (!rosterData) {
        this.validationResult = {
          success: false,
          message: 'CCCD không có trong danh sách tham dự - hãy liên hệ ban tổ chức'
        };
        return;
      }

      // Kiểm tra đã điểm danh chưa
      const attendanceData = await this.supabase.checkAttendance(this.votingCode.trim());
      
      if (!attendanceData) {
        this.validationResult = {
          success: false,
          message: 'Bạn chưa điểm danh. Vui lòng điểm danh trước khi bầu cử.\n\nHãy đến khu vực điểm danh để quét QR code.'
        };
        return;
      }

      // Kiểm tra đã bầu cử chưa
      const { data: existingVote, error: voteError } = await this.supabase.supabase
        .from('votes')
        .select('*')
        .eq('cccd', this.votingCode.trim())
        .single();

      if (existingVote) {
        this.validationResult = {
          success: false,
          message: 'Bạn đã bầu cử rồi. Mỗi người chỉ được bầu một lần.\n\nCảm ơn bạn đã tham gia bầu cử!'
        };
        return;
      }

      this.validationResult = {
        success: true,
        message: `CCCD hợp lệ!\nHọ tên: ${rosterData.hoten}\nMSSV: ${rosterData.mssv || 'N/A'}`,
        data: rosterData
      };

    } catch (error: any) {
      this.validationResult = {
        success: false,
        message: `Lỗi xác thực: ${error.message}`
      };
    } finally {
      this.isValidatingCode = false;
    }
  }

  async submitVote() {
    if (!this.selectedCandidate) {
      this.voteResult = {
        success: false,
        message: 'Vui lòng chọn ứng cử viên'
      };
      return;
    }

    if (!this.validationResult?.success) {
      this.voteResult = {
        success: false,
        message: 'Vui lòng xác thực mã phiếu trước'
      };
      return;
    }

    this.isSubmittingVote = true;
    this.voteResult = null;

    try {
      // Submit the vote
      const vote = await this.supabase.submitVote(
        this.votingCode.trim(),
        this.selectedCandidate
      );

      this.voteResult = {
        success: true,
        message: `Bầu cử thành công!\nỨng cử viên: ${this.selectedCandidate}\nThời gian: ${new Date(vote.voted_at).toLocaleString('vi-VN')}`
      };

      // Reset form
      this.resetForm();

    } catch (error: any) {
      this.voteResult = {
        success: false,
        message: `Lỗi bầu cử: ${error.message}`
      };
    } finally {
      this.isSubmittingVote = false;
    }
  }

  resetForm() {
    this.votingCode = '';
    this.validationResult = null;
    this.selectedCandidate = '';
    this.voteResult = null;
  }

  selectCandidate(candidate: string) {
    this.selectedCandidate = candidate;
    this.voteResult = null; // Clear previous vote result when selecting new candidate
  }
}