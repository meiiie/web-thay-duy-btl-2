import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserQRCodeReader } from '@zxing/browser';
import { SupabaseService, RosterRecord, AttendanceRecord } from '../../services/supabase.service';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.html',
  styleUrls: ['./qr-scanner.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() scanResult = new EventEmitter<{success: boolean, message: string, data?: any}>();

  codeReader = new BrowserQRCodeReader();
  isScanning = false;
  status: { valid: boolean, message: string } | null = null;
  manualInput: string = '';
  inputMode: 'cccd' | 'mssv' | 'qr' = 'cccd';
  showManualInput = false;
  showImageUpload = false;
  currentStream: MediaStream | null = null;
  scanAttempts = 0;
  maxScanAttempts = 20;
  debugInfo: string = '';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.startScanning();
  }
  

  ngOnDestroy() {
    this.stopScanning();
  }

  async startScanning() {
    try {
      this.isScanning = true;
      this.status = null;
      this.scanAttempts = 0;
      this.debugInfo = 'Đang khởi tạo webcam...';
      
      // Wait for DOM to be ready
      await this.waitForVideoElement();
      
      const videoElement = document.getElementById('video') as HTMLVideoElement;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      this.debugInfo = 'Đang yêu cầu quyền truy cập webcam...';
      
      // Request camera access with multiple fallback options
      let stream: MediaStream | null = null;
      
      // Try different camera configurations
      const cameraConfigs = [
        // High quality for desktop
        { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, min: 15 }
          } 
        },
        // Medium quality fallback
        { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 24, min: 10 }
          } 
        },
        // Basic quality fallback
        { 
          video: { 
            facingMode: 'environment'
          } 
        },
        // Any camera fallback
        { 
          video: true
        }
      ];

      for (let i = 0; i < cameraConfigs.length; i++) {
        try {
          this.debugInfo = `Thử cấu hình camera ${i + 1}/${cameraConfigs.length}...`;
          stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
          this.debugInfo = `Thành công với cấu hình ${i + 1}`;
          break;
        } catch (error) {
          console.log(`Camera config ${i + 1} failed:`, error);
          this.debugInfo = `Cấu hình ${i + 1} thất bại, thử tiếp...`;
        }
      }

      if (!stream) {
        throw new Error('Không thể truy cập webcam với bất kỳ cấu hình nào');
      }

      this.currentStream = stream;
      videoElement.srcObject = this.currentStream;
      
      this.debugInfo = 'Đang chờ video sẵn sàng...';
      
      // Wait for video to be ready with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video to load'));
        }, 10000);

        videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          this.debugInfo = 'Video đã sẵn sàng, bắt đầu quét QR...';
          resolve(true);
        };

        videoElement.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video load error'));
        };
      });

      // Start QR code scanning
      this.codeReader.decodeFromVideoDevice(undefined, 'video', async (result, error) => {
        if (result) {
          await this.handleQRResult(result.getText());
        }
      });

      this.status = { valid: true, message: 'Đang quét mã QR... Đưa CCCD/VNeID vào khung hình' };
      
    } catch (err: any) {
      console.error('Webcam error:', err);
      this.isScanning = false;
      this.debugInfo = `Lỗi: ${err.message}`;
      
      // More specific error messages
      let errorMessage = 'Không thể truy cập webcam. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Vui lòng cho phép truy cập webcam và thử lại.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'Không tìm thấy webcam trên thiết bị.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Webcam đang được sử dụng bởi ứng dụng khác.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Webcam không hỗ trợ cấu hình yêu cầu.';
      } else {
        errorMessage += `Lỗi: ${err.message}`;
      }
      
      this.status = { 
        valid: false, 
        message: errorMessage
      };
      this.showFallbackOptions();
    }
  }

  stopScanning() {
    this.isScanning = false;
    this.debugInfo = '';
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  async handleQRResult(qrText: string) {
    try {
      console.log('QR Text received:', qrText);
      
      // Show processing status
      this.status = { valid: true, message: 'Đang xử lý mã QR...' };
      
      // Extract CCCD from QR text with comprehensive parsing
      const extractedData = this.extractCCCDAdvanced(qrText);
      
      if (!extractedData.cccd) {
        this.status = { 
          valid: false, 
          message: `Không tìm thấy số CCCD hợp lệ trong mã QR.\n\nNội dung QR: ${qrText.substring(0, 100)}${qrText.length > 100 ? '...' : ''}\n\nVui lòng:\n- Thử lại với QR code khác\n- Upload ảnh QR rõ nét hơn\n- Nhập thủ công số CCCD` 
        };
        return;
      }

      // Validate CCCD format
      if (!/^\d{12}$/.test(extractedData.cccd)) {
        this.status = { 
          valid: false, 
          message: `Số CCCD không hợp lệ: ${extractedData.cccd}\nCCCD phải có đúng 12 chữ số.` 
        };
        return;
      }

      this.status = { valid: true, message: `Đã tìm thấy CCCD: ${extractedData.cccd}\nĐang kiểm tra trong danh sách...` };

      // Check if CCCD exists in roster
      const rosterRecord = await this.supabase.getRosterByCCCD(extractedData.cccd);
      
      if (!rosterRecord) {
        // Improved error message with extracted name
        let errorMessage = `Không tìm thấy CCCD ${extractedData.cccd} trong danh sách đại biểu`;
        
        if (extractedData.name) {
          errorMessage += `\nTên từ QR: ${extractedData.name}`;
        }
        
        errorMessage += '\n\nVui lòng:';
        errorMessage += '\n- Kiểm tra CCCD có trong danh sách';
        errorMessage += '\n- Liên hệ quản trị viên để thêm vào danh sách';
        errorMessage += '\n- Hoặc nhập thủ công CCCD khác';
        
        this.status = { 
          valid: false, 
          message: errorMessage
        };
        return;
      }

      this.status = { valid: true, message: `Tìm thấy: ${rosterRecord.hoten}\nĐang kiểm tra điểm danh...` };

      // Check if already attended
      const attendanceRecord = await this.supabase.checkAttendance(extractedData.cccd);
      
      if (attendanceRecord) {
        this.status = { 
          valid: false, 
          message: `CCCD ${extractedData.cccd} đã điểm danh lúc ${new Date(attendanceRecord.time).toLocaleString('vi-VN')}\n\nHọ tên: ${rosterRecord.hoten}\nMSSV: ${rosterRecord.mssv || 'N/A'}` 
        };
        return;
      }

      this.status = { valid: true, message: 'Đang ghi nhận điểm danh...' };

      // Mark attendance
      const attendance = await this.supabase.markAttendance(extractedData.cccd);

      this.status = { 
        valid: true, 
        message: `✅ ĐIỂM DANH THÀNH CÔNG!\n\nHọ tên: ${rosterRecord.hoten}\nMSSV: ${rosterRecord.mssv || 'N/A'}\nCCCD: ${extractedData.cccd}\n\nThời gian: ${new Date().toLocaleString('vi-VN')}` 
      };

      // Emit success result
      this.scanResult.emit({
        success: true,
        message: `Điểm danh thành công cho ${rosterRecord.hoten}`,
        data: {
          roster: rosterRecord,
          attendance: attendance
        }
      });

      // Stop scanning after successful scan
      setTimeout(() => {
        this.stopScanning();
      }, 5000);

    } catch (error: any) {
      console.error('Error processing QR result:', error);
      
      let errorMessage = 'Lỗi xử lý dữ liệu: ';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage += 'Không có quyền truy cập. Vui lòng liên hệ quản trị viên.';
      } else if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        errorMessage += 'Dữ liệu đã tồn tại. Có thể CCCD đã được điểm danh.';
      } else {
        errorMessage += error.message || 'Lỗi không xác định';
      }
      
      this.status = { 
        valid: false, 
        message: errorMessage
      };
    }
  }

  extractCCCDAdvanced(qrText: string): { cccd: string, name?: string, additionalInfo?: any } {
    console.log('Parsing QR text:', qrText);
    
    // Remove any whitespace and normalize
    const cleanText = qrText.trim().replace(/\s+/g, '');
    
    // Method 1: Direct 12-digit CCCD
    let cccdMatch = cleanText.match(/(\d{12})/);
    
    // Method 2: CCCD with separators (012345678901|NAME|OTHER) - Fix regex
    if (!cccdMatch) {
      cccdMatch = cleanText.match(/(\d{12})[|;,\s]/);
    }
    
    // Method 2.1: CCCD at the beginning with pipe separator
    if (!cccdMatch) {
      cccdMatch = cleanText.match(/^(\d{12})\|/);
    }
    
    // Method 3: CCCD in TLV format (Tag-Length-Value)
    if (!cccdMatch) {
      // Look for CCCD in TLV format
      const tlvMatch = cleanText.match(/CCCD[:\s]*(\d{12})/i);
      if (tlvMatch) {
        cccdMatch = tlvMatch;
      }
    }
    
    // Method 4: JSON format
    if (!cccdMatch) {
      try {
        const jsonData = JSON.parse(qrText);
        if (jsonData.cccd || jsonData.CCCD || jsonData.id) {
          const cccdValue = jsonData.cccd || jsonData.CCCD || jsonData.id;
          cccdMatch = cccdValue.toString().match(/(\d{12})/);
        }
      } catch (e) {
        // Not JSON, continue
      }
    }
    
    // Method 5: Base64 encoded data
    if (!cccdMatch) {
      try {
        const decoded = atob(qrText);
        cccdMatch = decoded.match(/(\d{12})/);
      } catch (e) {
        // Not base64, continue
      }
    }
    
    // Method 6: Vietnamese specific formats
    if (!cccdMatch) {
      // Format: CCCD012345678901NAME...
      cccdMatch = cleanText.match(/CCCD(\d{12})/i);
    }
    
    if (!cccdMatch) {
      // Format: 012345678901NAME...
      cccdMatch = cleanText.match(/^(\d{12})[A-Za-z]/);
    }

    // Method 7: VNeID specific formats
    if (!cccdMatch) {
      // VNeID might have different patterns
      const vneidPatterns = [
        /VNEID[:\s]*(\d{12})/i,
        /ID[:\s]*(\d{12})/i,
        /(\d{12})[A-Za-z]{2,}/, // CCCD followed by letters
      ];
      
      for (const pattern of vneidPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          cccdMatch = match;
          break;
        }
      }
    }

    // Method 8: Vietnamese QR formats with specific delimiters
    if (!cccdMatch) {
      // Common Vietnamese QR formats
      const vietnamesePatterns = [
        /(\d{12})[|;,\s]+[A-Za-zÀ-ỹ\s]+/, // CCCD followed by Vietnamese name
        /[A-Za-zÀ-ỹ\s]+[|;,\s]+(\d{12})/, // Vietnamese name followed by CCCD
        /(\d{12})[|;,\s]+[A-Za-zÀ-ỹ\s]+[|;,\s]+[A-Za-z0-9\s]+/, // CCCD|Name|Other
      ];
      
      for (const pattern of vietnamesePatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          cccdMatch = match;
          break;
        }
      }
    }

    // Method 9: Hex encoded data
    if (!cccdMatch) {
      try {
        // Check if it's hex encoded
        if (/^[0-9A-Fa-f]+$/.test(cleanText) && cleanText.length > 24) {
          const decoded = this.hexToString(cleanText);
          cccdMatch = decoded.match(/(\d{12})/);
        }
      } catch (e) {
        // Not hex, continue
      }
    }

    // Extract name if available
    let name: string | undefined;
    
    // Try various name extraction patterns
    const namePatterns = [
      /NAME[:\s]*([^|,\n]+)/i,
      /HOTEN[:\s]*([^|,\n]+)/i,
      /TEN[:\s]*([^|,\n]+)/i,
      /(\d{12})[|;,\s]*([^|,\n]+)/,
      /CCCD[:\s]*\d{12}[|;,\s]*([^|,\n]+)/i,
      /VNEID[:\s]*\d{12}[|;,\s]*([^|,\n]+)/i,
      // Vietnamese specific patterns
      /(\d{12})[|;,\s]+([A-Za-zÀ-ỹ\s]+)/,
      /([A-Za-zÀ-ỹ\s]+)[|;,\s]+(\d{12})/,
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = qrText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        name = nameMatch[1].trim();
        break;
      }
    }

    const result = {
      cccd: cccdMatch ? cccdMatch[1] : '',
      name: name,
      additionalInfo: {
        originalText: qrText,
        cleanText: cleanText,
        foundPattern: cccdMatch ? cccdMatch[0] : null
      }
    };
    
    console.log('Extracted data:', result);
    return result;
  }

  // Helper method to convert hex to string
  private hexToString(hex: string): string {
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexByte = hex.substr(i, 2);
      const charCode = parseInt(hexByte, 16);
      if (charCode > 0) {
        result += String.fromCharCode(charCode);
      }
    }
    return result;
  }

  showFallbackOptions() {
    this.showManualInput = true;
    this.showImageUpload = true;
  }

  async onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    try {
      this.status = { valid: true, message: 'Đang xử lý ảnh...' };
      
      // Use ZXing for image scanning
      const imageUrl = URL.createObjectURL(file);
      const result = await this.codeReader.decodeFromImageUrl(imageUrl);
      URL.revokeObjectURL(imageUrl);
      
      if (result) {
        await this.handleQRResult(result.getText());
      } else {
        this.status = { 
          valid: false, 
          message: 'Không thể đọc mã QR từ ảnh. Vui lòng thử ảnh khác hoặc nhập thủ công.' 
        };
      }
      
    } catch (error: any) {
      this.status = { 
        valid: false, 
        message: `Lỗi xử lý ảnh: ${error.message}` 
      };
    }
  }

  async manualSearch() {
    if (!this.manualInput.trim()) {
      this.status = { 
        valid: false, 
        message: 'Vui lòng nhập CCCD hoặc MSSV' 
      };
      return;
    }

    try {
      const query = this.manualInput.trim();
      this.status = { valid: true, message: 'Đang tìm kiếm...' };
      
      // Try to extract CCCD if user entered full QR text
      const extractedData = this.extractCCCDAdvanced(query);
      const searchQuery = extractedData.cccd || query;
      
      // If we have a valid CCCD format, search directly
      if (/^\d{12}$/.test(searchQuery)) {
        const rosterRecord = await this.supabase.getRosterByCCCD(searchQuery);
        
        if (rosterRecord) {
          await this.handleQRResult(rosterRecord.cccd);
          return;
        } else {
          this.status = { 
            valid: false, 
            message: `Không tìm thấy CCCD ${searchQuery} trong danh sách đại biểu\n\nVui lòng:\n- Kiểm tra lại số CCCD\n- Liên hệ quản trị viên để thêm vào danh sách` 
          };
          return;
        }
      }
      
      // Otherwise, do fuzzy search
      const results = await this.supabase.searchRoster(searchQuery);
      
      if (results.length === 0) {
        let errorMessage = `Không tìm thấy "${searchQuery}" trong danh sách`;
        
        if (extractedData.name) {
          errorMessage += `\nTên từ QR: ${extractedData.name}`;
        }
        
        errorMessage += '\n\nVui lòng:';
        errorMessage += '\n- Kiểm tra lại CCCD/MSSV';
        errorMessage += '\n- Thử tìm kiếm với từ khóa khác';
        errorMessage += '\n- Liên hệ quản trị viên';
        
        this.status = { 
          valid: false, 
          message: errorMessage
        };
        return;
      }

      if (results.length === 1) {
        // Auto-select if only one result
        this.status = { valid: true, message: `Tìm thấy: ${results[0].hoten}\nĐang xử lý...` };
        await this.handleQRResult(results[0].cccd);
      } else {
        // Show multiple results
        const resultList = results.slice(0, 10).map(r => `${r.cccd} - ${r.hoten}${r.mssv ? ` (${r.mssv})` : ''}`).join('\n');
        const moreResults = results.length > 10 ? `\n... và ${results.length - 10} kết quả khác` : '';
        
        this.status = { 
          valid: false, 
          message: `Tìm thấy ${results.length} kết quả:\n\n${resultList}${moreResults}\n\nVui lòng nhập chính xác CCCD hoặc MSSV để tìm kiếm cụ thể hơn.` 
        };
      }
    } catch (error: any) {
      console.error('Manual search error:', error);
      
      let errorMessage = 'Lỗi tìm kiếm: ';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage += 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        errorMessage += 'Không có quyền truy cập. Vui lòng liên hệ quản trị viên.';
      } else {
        errorMessage += error.message || 'Lỗi không xác định';
      }
      
      this.status = { 
        valid: false, 
        message: errorMessage
      };
    }
  }

  resetScanner() {
    this.status = null;
    this.manualInput = '';
    this.showManualInput = false;
    this.showImageUpload = false;
    this.scanAttempts = 0;
    this.debugInfo = '';
    this.startScanning();
  }

  // Wait for video element to be available in DOM
  private async waitForVideoElement(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxAttempts = 50;
      let attempts = 0;
      
      const checkElement = () => {
        attempts++;
        const videoElement = document.getElementById('video');
        
        if (videoElement) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Video element not found after maximum attempts'));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  }

  setInputMode(mode: 'cccd' | 'mssv' | 'qr') {
    this.inputMode = mode;
    this.manualInput = '';
  }

  // Debug method to check camera permissions
  async checkCameraPermissions() {
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('Camera permission:', permissions.state);
      return permissions.state;
    } catch (error) {
      console.log('Cannot check camera permissions:', error);
      return 'unknown';
    }
  }
  

  // Toggle methods for UI controls
  toggleManualInput() {
    this.showManualInput = !this.showManualInput;
    if (this.showManualInput) {
      this.showImageUpload = false;
    }
  }

  toggleImageUpload() {
    this.showImageUpload = !this.showImageUpload;
    if (this.showImageUpload) {
      this.showManualInput = false;
    }
  }
}