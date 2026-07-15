import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  signup(payload: {
    name: string;
    email: string;
    password: string;
    picture?: File;
  }) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('password', payload.password);

    if (payload.picture) {
      formData.append('picture', payload.picture);
    }

    return this.http.post('/api/signup/', formData);
  }
}
