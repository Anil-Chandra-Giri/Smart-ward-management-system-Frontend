import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ApiService } from '../../../../../Services/api.service';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-poll-results',
  imports: [CommonModule],
  templateUrl: './poll-results.component.html',
})
export class PollResultsComponent implements OnInit, OnDestroy {

  pollId!: string;
  loading = false;
  errorMessage = '';

  private chart: Chart | null = null;
  private paramSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private pollService: ApiService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    // Subscribe to paramMap (not route.snapshot, which only ever reads
    // once) — Angular reuses this component instance when navigating
    // between two activations of the same route, only changing the :id
    // param. A snapshot read in ngOnInit would never see that change,
    // leaving the page stuck on whichever poll loaded first.
    this.paramSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.pollId = id;
        this.loadResults();
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.chart?.destroy();
  }

  pollTitle = '';
  totalVotes = 0;

  loadResults(): void {
    this.loading = true;
    this.errorMessage = '';

    this.pollService.getResults(this.pollId).subscribe({
      next: (res: any) => {
        this.loading = false;
        // GetResults returns { pollId, pollTitle, totalVotes, results: [...] } —
        // not a raw array. res.map() was being called on the wrapper object
        // itself, which has no .map(), hence "res.map is not a function".
        this.pollTitle = res.pollTitle ?? '';
        this.totalVotes = res.totalVotes ?? 0;
        this.renderChart(res.results ?? []);
      },
      error: (err) => {
        console.error('Error loading poll results:', err);
        this.loading = false;
        this.errorMessage = `Error loading results (HTTP ${err.status}).`;
      },
    });
  }

  private renderChart(res: any[]): void {
    const labels = res.map((x: any) => x.option);
    const data = res.map((x: any) => x.votes);

    // Chart.js throws "Canvas is already in use" if a second Chart is
    // created on the same canvas without destroying the first — this
    // covers both the initial render and switching between polls.
    this.chart?.destroy();

    this.chart = new Chart('chart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Votes',
          data,
        }],
      },
    });
  }

  goBack(): void {
    // Uses browser history rather than a hardcoded route — this component
    // is reused from both /citizen/polls/results/:id and
    // /ward/polls/results/:id, so a fixed "back" destination would be
    // wrong for one of the two contexts.
    this.location.back();
  }
}