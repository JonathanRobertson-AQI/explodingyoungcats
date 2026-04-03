import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateHighScoreRequest {
  playerName: string;
  score: number;
  levelReached?: number;
}

export interface HighScoreResponse {
  id: string;
  playerName: string | null;
  score: number;
  levelReached: number | null;
  createdAtUtc: string;
}

@Injectable({ providedIn: 'root' })
export class HighScoreApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl =
    'https://ci-api-gabnhtaxhhd0eydh.canadacentral-01.azurewebsites.net';

  submitHighScore(payload: CreateHighScoreRequest): Observable<HighScoreResponse> {
    return this.http.post<HighScoreResponse>(`${this.apiBaseUrl}/api/HighScores`, payload);
  }

  getTopHighScores(limit = 10): Observable<HighScoreResponse[]> {
    return this.http.get<HighScoreResponse[]>(`${this.apiBaseUrl}/api/HighScores`, {
      params: { limit },
    });
  }
}
