import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, ElectionStatus } from '../../services/supabase.service';
import { interval, Subscription } from 'rxjs';

interface ActivityItem {
  type: 'attendance' | 'voting';
  message: string;
  time: Date;
}

interface VotingResult {
  name: string;
  votes: number;
  percentage: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule],
  standalone: true
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentTime = signal(new Date());
  attendanceStats = signal({
    total: 0,
    percentage: 0
  });
  votingStats = signal({
    total: 0,
    percentage: 0
  });
  candidatesStats = signal({
    total: 0
  });
  participationRate = signal(0);
  recentActivities = signal<ActivityItem[]>([]);
  votingResults = signal<VotingResult[]>([]);
  electionStatus = signal<ElectionStatus | null>(null);
  publishedResults = signal<VotingResult[]>([]);
  winner = signal<VotingResult | null>(null);
  isRefreshing = false;
  databaseStatus = 'online';
  qrScannerStatus = 'online';

  private timeSubscription?: Subscription;
  private refreshSubscription?: Subscription;

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.startTimeUpdate();
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.timeSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  private startTimeUpdate() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime.set(new Date());
    });
  }

  private startAutoRefresh() {
    // Refresh data every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.refreshData();
    });
  }

  async loadDashboardData() {
    try {
      this.isRefreshing = true;
      
      // Load all data in parallel
      const [
        rosterData,
        attendanceData,
        votingData,
        votingStatsData,
        electionStatusData
      ] = await Promise.all([
        this.supabase.getRoster(),
        this.supabase.getAttendanceList(),
        this.supabase.getVotingResults(),
        this.supabase.getVotingStats(),
        this.supabase.getElectionStatus()
      ]);

      // Calculate attendance stats
      const totalRoster = rosterData.length;
      const totalAttendance = attendanceData.length;
      const attendancePercentage = totalRoster > 0 ? Math.round((totalAttendance / totalRoster) * 100) : 0;
      
      this.attendanceStats.set({
        total: totalAttendance,
        percentage: attendancePercentage
      });

      // Calculate voting stats
      const totalVotes = votingData.length;
      const votingPercentage = totalAttendance > 0 ? Math.round((totalVotes / totalAttendance) * 100) : 0;
      
      this.votingStats.set({
        total: totalVotes,
        percentage: votingPercentage
      });

      // Calculate candidates stats
      const candidatesCount = Object.keys(votingStatsData).length;
      this.candidatesStats.set({
        total: candidatesCount
      });

      // Calculate participation rate
      const participation = totalRoster > 0 ? Math.round((totalVotes / totalRoster) * 100) : 0;
      this.participationRate.set(participation);

      // Process voting results
      const results: VotingResult[] = Object.entries(votingStatsData).map(([name, votes]) => ({
        name,
        votes: votes as number,
        percentage: totalVotes > 0 ? Math.round(((votes as number) / totalVotes) * 100) : 0
      })).sort((a, b) => b.votes - a.votes);

      this.votingResults.set(results);

      // Set election status
      this.electionStatus.set(electionStatusData);

      // Load published results if election is published
      if (electionStatusData.status === 'results_published') {
        await this.loadPublishedResults();
      }

      // Generate recent activities
      this.generateRecentActivities(attendanceData, votingData);

      // Update status indicators
      this.updateStatusIndicators();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.databaseStatus = 'offline';
    } finally {
      this.isRefreshing = false;
    }
  }

  private generateRecentActivities(attendanceData: any[], votingData: any[]) {
    const activities: ActivityItem[] = [];

    // Add recent attendance activities
    attendanceData.slice(0, 5).forEach(record => {
      activities.push({
        type: 'attendance',
        message: `${record.roster?.hoten || 'Người dùng'} đã điểm danh`,
        time: new Date(record.time)
      });
    });

    // Add recent voting activities
    votingData.slice(0, 5).forEach(vote => {
      activities.push({
        type: 'voting',
        message: `${vote.roster?.hoten || 'Người dùng'} đã bầu cho ${vote.candidate}`,
        time: new Date(vote.voted_at)
      });
    });

    // Sort by time and take the most recent 10
    activities.sort((a, b) => b.time.getTime() - a.time.getTime());
    this.recentActivities.set(activities.slice(0, 10));
  }

  private updateStatusIndicators() {
    // Check database connection
    this.supabase.getRoster().then(() => {
      this.databaseStatus = 'online';
    }).catch(() => {
      this.databaseStatus = 'offline';
    });

    // Check QR scanner status (simplified check)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      this.qrScannerStatus = 'online';
    } else {
      this.qrScannerStatus = 'offline';
    }
  }

  async refreshData() {
    await this.loadDashboardData();
  }

  private async loadPublishedResults() {
    try {
      const results = await this.supabase.getElectionResults();
      
      // Convert to VotingResult format
      const publishedResults: VotingResult[] = results.map(result => ({
        name: result.candidate,
        votes: result.votes,
        percentage: parseFloat(result.percentage)
      }));

      this.publishedResults.set(publishedResults);
      
      // Set winner (first place)
      if (publishedResults.length > 0) {
        this.winner.set(publishedResults[0]);
      }
    } catch (error) {
      console.error('Error loading published results:', error);
    }
  }

  // Utility methods for template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  getElectionStatusText(): string {
    const status = this.electionStatus();
    if (!status) return 'Không xác định';
    
    switch (status.status) {
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
    const status = this.electionStatus();
    if (!status) return 'secondary';
    
    switch (status.status) {
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
}