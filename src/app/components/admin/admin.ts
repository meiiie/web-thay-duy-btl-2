import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService, RosterRecord, AttendanceRecord, Vote, Candidate, ElectionStatus } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class AdminComponent implements OnInit {
  activeTab = 'attendance';
  attendanceList: AttendanceRecord[] = [];
  votingResults: Vote[] = [];
  votingStats: any = {};
  rosterList: RosterRecord[] = [];
  candidatesList: Candidate[] = [];
  isLoading = false;

  // New roster form
  newRoster = {
    cccd: '',
    hoten: '',
    mssv: ''
  };

  // New candidate form
  newCandidate = {
    name: '',
    position: '',
    description: '',
    active: true,
    image_url: ''
  };

  // Image upload
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedRosterList: RosterRecord[] = [];
  paginatedCandidatesList: Candidate[] = [];

  // Excel Import
  showExcelModal = false;
  excelData: any[] = [];
  excelPreview: any[] = [];
  selectedExcelFile: File | null = null;

  // Election Management
  electionStatus: ElectionStatus | null = null;
  showEndElectionModal = false;
  showPublishResultsModal = false;
  electionResults: any[] = [];
  totalVotes = 0;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router
  ) {}

  // Expose Math to template
  Math = Math;

  async ngOnInit() {
    // Check authentication
    if (!this.authService.isLoggedIn() || !this.authService.isSessionValid()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadAttendanceList(),
        this.loadVotingResults(),
        this.loadRosterList(),
        this.loadCandidatesList(),
        this.loadElectionStatus()
      ]);
    } finally {
      this.isLoading = false;
    }
  }

  async loadElectionStatus() {
    try {
      this.electionStatus = await this.supabase.getElectionStatus();
    } catch (error: any) {
      console.error('Error loading election status:', error);
      // Set default status if error
      this.electionStatus = {
        id: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async loadAttendanceList() {
    try {
      this.attendanceList = await this.supabase.getAttendanceList();
    } catch (error: any) {
      console.error('Error loading attendance:', error);
    }
  }

  async loadVotingResults() {
    try {
      this.votingResults = await this.supabase.getVotingResults();
      this.votingStats = await this.supabase.getVotingStats();
    } catch (error: any) {
      console.error('Error loading voting results:', error);
    }
  }

  async loadRosterList() {
    try {
      this.rosterList = await this.supabase.getRoster();
      this.updatePagination();
    } catch (error: any) {
      console.error('Error loading roster:', error);
    }
  }

  async loadCandidatesList() {
    try {
      this.candidatesList = await this.supabase.getCandidates();
      this.updatePagination();
    } catch (error: any) {
      console.error('Error loading candidates:', error);
    }
  }

  // Pagination methods
  updatePagination() {
    this.totalPages = Math.ceil(this.rosterList.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRosterList = this.rosterList.slice(startIndex, endIndex);
    this.paginatedCandidatesList = this.candidatesList.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }


  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  async addRosterMember() {
    if (!this.newRoster.cccd || !this.newRoster.hoten) {
      alert('Vui lòng nhập đầy đủ thông tin CCCD và Họ tên');
      return;
    }

    try {
      // Simple insert - chỉ cần 3 fields
      const { error } = await this.supabase.supabase
        .from('roster')
        .insert({
          cccd: this.newRoster.cccd,
          hoten: this.newRoster.hoten,
          mssv: this.newRoster.mssv || null
        });

      if (error) throw error;

      alert('Thêm cử tri thành công!');
      this.newRoster = { cccd: '', hoten: '', mssv: '' };
      await this.loadRosterList();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  async addCandidate() {
    if (!this.newCandidate.name || !this.newCandidate.position) {
      alert('Vui lòng nhập đầy đủ thông tin Tên và Vị trí ứng cử');
      return;
    }

    try {
      // First add candidate without image
      const candidateData = { 
        name: this.newCandidate.name,
        position: this.newCandidate.position,
        description: this.newCandidate.description,
        active: this.newCandidate.active
      };
      
      const newCandidate = await this.supabase.addCandidate(candidateData);
      
      // Upload image if selected
      if (this.selectedImage && newCandidate.id) {
        try {
          const imageUrl = await this.supabase.uploadCandidateImage(this.selectedImage, newCandidate.id);
          // Update candidate with image URL
          await this.supabase.updateCandidate(newCandidate.id, { image_url: imageUrl });
        } catch (imageError: any) {
          console.error('Image upload failed:', imageError);
          alert('Ứng cử viên đã được thêm nhưng có lỗi khi upload ảnh. Bạn có thể cập nhật ảnh sau.');
        }
      }

      alert('Thêm ứng cử viên thành công!');
      this.resetCandidateForm();
      await this.loadCandidatesList();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  resetCandidateForm() {
    this.newCandidate = { name: '', position: '', description: '', active: true, image_url: '' };
    this.selectedImage = null;
    this.imagePreview = null;
  }

  async deleteCandidate(id: number) {
    if (!confirm('Bạn có chắc chắn muốn xóa ứng cử viên này?\n\nLưu ý: Hành động này sẽ xóa ứng cử viên khỏi danh sách bầu cử.')) {
      return;
    }

    try {
      // Get candidate info to delete image if exists
      const candidate = this.candidatesList.find(c => c.id === id);
      if (candidate?.image_url) {
        await this.supabase.deleteCandidateImage(candidate.image_url);
      }
      
      await this.supabase.deleteCandidate(id);
      alert('Xóa ứng cử viên thành công!');
      await this.loadCandidatesList();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      this.selectedImage = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  // Excel Import methods
  onExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.selectedExcelFile = file;
      this.readExcelFile(file);
    }
  }

  readExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert to array of objects
        const headers = jsonData[0] as string[];
        this.excelData = (jsonData.slice(1) as any[]).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        
        this.excelPreview = this.excelData.slice(0, 10); // Show first 10 rows
        this.showExcelModal = true;
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  downloadExcelTemplate() {
    const templateData = [
      ['CCCD', 'Họ và tên', 'MSSV'],
      ['123456789012', 'Nguyễn Văn A', 'SV001'],
      ['123456789013', 'Trần Thị B', 'SV002'],
      ['123456789014', 'Lê Văn C', 'SV003']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách cử tri');
    
    XLSX.writeFile(wb, 'mau_danh_sach_cu_tri.xlsx');
  }

  async importExcelData() {
    if (!this.excelData.length) {
      alert('Không có dữ liệu để import');
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of this.excelData) {
        try {
          // Validate required fields
          if (!row['CCCD'] || !row['Họ và tên'] || !row['MSSV']) {
            errors.push(`Dòng thiếu thông tin: CCCD=${row['CCCD']}, Tên=${row['Họ và tên']}, MSSV=${row['MSSV']}`);
            errorCount++;
            continue;
          }

          // Validate CCCD format
          if (!/^[0-9]{12}$/.test(row['CCCD'])) {
            errors.push(`CCCD không hợp lệ: ${row['CCCD']}`);
            errorCount++;
            continue;
          }

          // Add to roster
          await this.supabase.addRosterMember({
            cccd: row['CCCD'],
            hoten: row['Họ và tên'],
            mssv: row['MSSV']
          });

          successCount++;
        } catch (error: any) {
          errors.push(`Lỗi thêm ${row['Họ và tên']}: ${error.message}`);
          errorCount++;
        }
      }

      // Show results
      let message = `Import hoàn tất!\nThành công: ${successCount}\nLỗi: ${errorCount}`;
      if (errors.length > 0) {
        message += `\n\nChi tiết lỗi:\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          message += `\n... và ${errors.length - 5} lỗi khác`;
        }
      }
      
      alert(message);
      
      // Reload data and close modal
      await this.loadRosterList();
      this.closeExcelModal();
      
    } catch (error: any) {
      alert(`Lỗi import: ${error.message}`);
    }
  }

  closeExcelModal() {
    this.showExcelModal = false;
    this.excelData = [];
    this.excelPreview = [];
    this.selectedExcelFile = null;
  }

  // Election Management methods
  async endElection() {
    if (!confirm('Bạn có chắc chắn muốn kết thúc cuộc bầu cử?\n\nSau khi kết thúc:\n- Không thể bầu cử thêm\n- Có thể xem và công bố kết quả\n- Hành động này không thể hoàn tác')) {
      return;
    }

    try {
      this.electionStatus = await this.supabase.updateElectionStatus('ended');
      await this.calculateElectionResults();
      alert('Cuộc bầu cử đã được kết thúc thành công!');
      this.closeEndElectionModal();
    } catch (error: any) {
      alert(`Lỗi kết thúc cuộc bầu cử: ${error.message}`);
    }
  }

  async publishResults() {
    if (!confirm('Bạn có chắc chắn muốn công bố kết quả bầu cử?\n\nSau khi công bố:\n- Kết quả sẽ được hiển thị công khai\n- Không thể thay đổi kết quả\n- Hành động này không thể hoàn tác')) {
      return;
    }

    try {
      this.electionStatus = await this.supabase.updateElectionStatus('results_published');
      alert('Kết quả bầu cử đã được công bố thành công!');
      this.closePublishResultsModal();
    } catch (error: any) {
      alert(`Lỗi công bố kết quả: ${error.message}`);
    }
  }

  async calculateElectionResults() {
    try {
      this.electionResults = await this.supabase.getElectionResults();
      this.totalVotes = this.electionResults.reduce((sum, result) => sum + result.votes, 0);
    } catch (error: any) {
      console.error('Error calculating election results:', error);
      throw error;
    }
  }

  openEndElectionModal() {
    this.showEndElectionModal = true;
  }

  closeEndElectionModal() {
    this.showEndElectionModal = false;
  }

  openPublishResultsModal() {
    this.showPublishResultsModal = true;
  }

  closePublishResultsModal() {
    this.showPublishResultsModal = false;
  }

  getElectionStatusText(): string {
    if (!this.electionStatus) return 'Không xác định';
    
    switch (this.electionStatus.status) {
      case 'active':
        return 'Đang diễn ra';
      case 'ended':
        return 'Đã kết thúc';
      case 'results_published':
        return 'Đã công bố kết quả';
      default:
        return 'Không xác định';
    }
  }

  getElectionStatusColor(): string {
    if (!this.electionStatus) return 'secondary';
    
    switch (this.electionStatus.status) {
      case 'active':
        return 'success';
      case 'ended':
        return 'warning';
      case 'results_published':
        return 'primary';
      default:
        return 'secondary';
    }
  }


  async deleteRosterMember(cccd: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?\n\nLưu ý: Hành động này sẽ xóa:\n- Thông tin cử tri\n- Lịch sử điểm danh\n- Mã bỏ phiếu (nếu có)\n- Phiếu bầu (nếu có)')) {
      return;
    }

    try {
      console.log(`\n=== Deleting roster member: ${cccd} ===`);
      
      // Kiểm tra dữ liệu hiện tại trước khi xóa
      console.log('Checking current data...');
      const { data: votes } = await this.supabase.supabase
        .from('votes')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: attendance } = await this.supabase.supabase
        .from('attendance')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: codes } = await this.supabase.supabase
        .from('codes')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: roster } = await this.supabase.supabase
        .from('roster')
        .select('*')
        .eq('cccd', cccd);
      
      console.log(`Found: ${votes?.length || 0} votes, ${attendance?.length || 0} attendance, ${codes?.length || 0} codes, ${roster?.length || 0} roster`);
      
      // Xóa theo thứ tự: votes -> codes -> attendance -> roster
      // 1. Xóa votes (có foreign key đến roster)
      console.log('Step 1: Deleting votes...');
      const { error: votesError } = await this.supabase.supabase
        .from('votes')
        .delete()
        .eq('cccd', cccd);
      
      if (votesError) {
        console.error('❌ Votes delete error:', votesError);
        // Không throw error ngay, tiếp tục thử
      } else {
        console.log('✅ Votes deleted successfully');
      }

      // 2. Xóa codes (có foreign key đến roster)
      console.log('Step 2: Deleting codes...');
      const { error: codesError } = await this.supabase.supabase
        .from('codes')
        .delete()
        .eq('cccd', cccd);
      
      if (codesError) {
        console.error('❌ Codes delete error:', codesError);
        // Không throw error ngay, tiếp tục thử
      } else {
        console.log('✅ Codes deleted successfully');
      }

      // 3. Xóa attendance (có foreign key đến roster)
      console.log('Step 3: Deleting attendance...');
      const { error: attendanceError } = await this.supabase.supabase
        .from('attendance')
        .delete()
        .eq('cccd', cccd);
      
      if (attendanceError) {
        console.error('❌ Attendance delete error:', attendanceError);
        // Không throw error ngay, tiếp tục thử
      } else {
        console.log('✅ Attendance deleted successfully');
      }

      // 4. Xóa roster (primary key)
      console.log('Step 4: Deleting roster...');
      const { error: rosterError } = await this.supabase.supabase
        .from('roster')
        .delete()
        .eq('cccd', cccd);
      
      if (rosterError) {
        console.error('❌ Roster delete error:', rosterError);
        throw rosterError;
      } else {
        console.log('✅ Roster deleted successfully');
      }

      // Kiểm tra kết quả cuối cùng
      console.log('Verifying deletion...');
      const { data: finalVotes } = await this.supabase.supabase
        .from('votes')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: finalCodes } = await this.supabase.supabase
        .from('codes')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: finalAttendance } = await this.supabase.supabase
        .from('attendance')
        .select('*')
        .eq('cccd', cccd);
      
      const { data: finalRoster } = await this.supabase.supabase
        .from('roster')
        .select('*')
        .eq('cccd', cccd);
      
      console.log(`Final check: ${finalVotes?.length || 0} votes, ${finalCodes?.length || 0} codes, ${finalAttendance?.length || 0} attendance, ${finalRoster?.length || 0} roster`);
      
      if ((finalVotes?.length || 0) === 0 && 
          (finalCodes?.length || 0) === 0 &&
          (finalAttendance?.length || 0) === 0 && 
          (finalRoster?.length || 0) === 0) {
        console.log('🎉 DELETE COMPLETED SUCCESSFULLY!');
        alert('Xóa thành viên thành công!\nĐã xóa tất cả dữ liệu liên quan.');
      } else {
        console.log('⚠️ Some data still exists');
        alert('Xóa thành viên hoàn tất!\nMột số dữ liệu có thể vẫn còn tồn tại.');
      }
      
      await this.loadRosterList();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      alert(`Lỗi xóa thành viên: ${error.message || error.details || 'Không thể xóa do có dữ liệu liên quan'}`);
    }
  }


  async exportAttendance() {
    const csvContent = this.generateCSV(this.attendanceList, [
      'cccd', 'time', 'roster.hoten', 'roster.mssv'
    ]);
    this.downloadCSV(csvContent, 'attendance.csv');
  }

  async exportVotingResults() {
    const csvContent = this.generateCSV(this.votingResults, [
      'candidate', 'voted_at', 'roster.hoten', 'roster.mssv'
    ]);
    this.downloadCSV(csvContent, 'voting_results.csv');
  }

  private generateCSV(data: any[], fields: string[]): string {
    const headers = fields.map(field => field.split('.').pop()).join(',');
    const rows = data.map(item => {
      return fields.map(field => {
        const value = this.getNestedValue(item, field);
        return `"${value || ''}"`;
      }).join(',');
    });
    
    return [headers, ...rows].join('\n');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getTotalAttendance(): number {
    return this.attendanceList.length;
  }

  getTotalVotes(): number {
    return this.votingResults.length;
  }

  getAttendanceRate(): number {
    if (this.rosterList.length === 0) return 0;
    return Math.round((this.attendanceList.length / this.rosterList.length) * 100);
  }

  getVotingRate(): number {
    if (this.attendanceList.length === 0) return 0;
    return Math.round((this.votingResults.length / this.attendanceList.length) * 100);
  }

  // Helper methods for template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  // Authentication methods
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getLoginTime() {
    return this.authService.getLoginTime();
  }

  logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      this.authService.logout();
    }
  }

  // Reset Data methods
  showResetDataModal = false;
  resetDataConfirmation = '';
  isResettingData = false;
  resetDataResult: { success: boolean; message: string; details?: any } | null = null;

  openResetDataModal() {
    this.showResetDataModal = true;
    this.resetDataConfirmation = '';
    this.resetDataResult = null;
  }

  closeResetDataModal() {
    this.showResetDataModal = false;
    this.resetDataConfirmation = '';
    this.resetDataResult = null;
  }

  async confirmResetData() {
    if (this.resetDataConfirmation !== 'RESET') {
      alert('Vui lòng nhập chính xác "RESET" để xác nhận');
      return;
    }

    this.isResettingData = true;
    this.resetDataResult = null;

    try {
      const result = await this.supabase.resetAllData();
      this.resetDataResult = result;

      if (result.success) {
        // Reload all data after successful reset
        await this.loadData();
        
        // Show success message with details
        let message = result.message;
        if (result.details) {
          message += `\n\nChi tiết:\n`;
          message += `- Đã xóa: ${JSON.stringify(result.details.deleted)}\n`;
          message += `- Còn lại: ${JSON.stringify(result.details.remaining)}\n`;
          message += `- Thời gian: ${new Date(result.details.resetTime).toLocaleString('vi-VN')}`;
        }
        
        alert(message);
        
        // Close modal after successful reset
        setTimeout(() => {
          this.closeResetDataModal();
        }, 2000);
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      this.resetDataResult = {
        success: false,
        message: `Lỗi không xác định: ${error.message}`
      };
      alert(`Lỗi: ${error.message}`);
    } finally {
      this.isResettingData = false;
    }
  }

  // Individual reset methods
  async resetAttendanceOnly() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu điểm danh?\n\nHành động này không thể hoàn tác!')) {
      return;
    }

    try {
      const result = await this.supabase.resetAttendanceData();
      if (result.success) {
        alert(result.message);
        await this.loadAttendanceList();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  async resetVotingOnly() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bầu cử?\n\nHành động này không thể hoàn tác!')) {
      return;
    }

    try {
      const result = await this.supabase.resetVotingData();
      if (result.success) {
        alert(result.message);
        await this.loadVotingResults();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  async resetCandidatesOnly() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu ứng cử viên?\n\nHành động này không thể hoàn tác!')) {
      return;
    }

    try {
      const result = await this.supabase.resetCandidatesData();
      if (result.success) {
        alert(result.message);
        await this.loadCandidatesList();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  async resetRosterOnly() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu cử tri?\n\nHành động này sẽ xóa:\n- Danh sách cử tri\n- Dữ liệu điểm danh\n- Dữ liệu bầu cử\n\nHành động này không thể hoàn tác!')) {
      return;
    }

    try {
      const result = await this.supabase.resetRosterData();
      if (result.success) {
        alert(result.message);
        await this.loadRosterList();
        await this.loadAttendanceList();
        await this.loadVotingResults();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }

  async resetElectionStatus() {
    if (!confirm('Bạn có chắc chắn muốn reset trạng thái cuộc bầu cử về "Đang diễn ra"?')) {
      return;
    }

    try {
      const result = await this.supabase.resetElectionStatus();
      if (result.success) {
        alert(result.message);
        await this.loadElectionStatus();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  }
}