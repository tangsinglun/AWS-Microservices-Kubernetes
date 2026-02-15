import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders,  HttpErrorResponse, HttpRequest, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { FeedItem } from '../feed/models/feed-item.model';
import { catchError, tap, map, concatAll } from 'rxjs/operators';
import { Binary } from '@angular/compiler';
import { JsonPipe } from '@angular/common';
import { ValueAccessor } from '@ionic/angular/dist/directives/control-value-accessors/value-accessor';

const API_HOST = environment.apiHost;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  token: string;

  constructor(private http: HttpClient) {
  }

  handleError(error: Error) {
    alert(error.message);
  }

  setAuthToken(token: string) {
    this.httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'})
    };
    this.httpOptions.headers = this.httpOptions.headers.append('Authorization', `Bearer ${token}`);
    this.token = token;
  }

  get(endpoint: string): Promise<any> {
    this.setAuthToken(this.token);
    const url = `${API_HOST}${endpoint}`; 
    let regexpSignedUrl: any = new RegExp('signed-url');  
    let regexpFeed: any = new RegExp('feed');
    let regexpUser: any = new RegExp('users');

    if (!regexpSignedUrl.test(endpoint) && !regexpUser.test(endpoint)) { 
      let req$: Observable<any>  = this.http.get(url, this.httpOptions).pipe(map(val => JSON.parse(this.extractData(val))));    
      return req$
      .toPromise()
      .catch((e: Error) => {
        this.handleError(e);
        throw e;
      });      
    }
    else if (!regexpFeed.test(endpoint) && !regexpSignedUrl.test(endpoint)) {
      let req$: Observable<any>  = this.http.get(url, this.httpOptions).pipe(map(val => JSON.parse(JSON.stringify(val))));    
      return req$
      .toPromise()
      .catch((e: Error) => {
        this.handleError(e);
        throw e;
      }); 
    }
    else {
        //let req$: Observable<any>  = this.http.get(url, this.httpOptions).pipe(map(val => JSON.parse(JSON.stringify({"url": val}))));
        return this.http.get(url, this.httpOptions).pipe(map(val => JSON.parse(JSON.stringify({"url":val}))))
        .toPromise()    
        .catch((e: Error) => {
          this.handleError(e);
          throw e;
        });   
    }
  } 

  post(endpoint: string, data: any): Promise<any> {
    const url = `${API_HOST}${endpoint}`;
    return this.http.post<HttpEvent<any>>(url, data, this.httpOptions)
            .toPromise()
            .catch((e) => {
              this.handleError(e);
              throw e;
            });
  };

  async upload(endpoint: string, file: File, payload: any): Promise<any> {  
    let signed_url: any = (await this.get(`${endpoint}/signed-url/${file.name}`).then((val: any) => val.url));
    const headers = new HttpHeaders({'Content-Type': file.type});
    //headers.append('Authorization', `jwt ${this.token}`);
    const req = new HttpRequest( 'PUT', signed_url.url, file,
                                  {
                                    headers: headers,  
                                    reportProgress: true, // track progress
                                  });
    
    

    return new Promise ( resolve => {
        this.http.request(req).subscribe((resp) => {
        if (resp && (<any> resp).status && (<any> resp).status === 200) {
          resolve(this.post(endpoint, payload));
        }
      });
    });
  }

  private extractData(data: any) {
    let feedItems: Array<any> = [];
    for (let i: number=0; i<data["count"]; i++) {

      feedItems[i] = {id: data["rows"][i].id,
                      url: data["rows"][i].url,
                      caption: data["rows"][i].caption}
    }
    return  `{"rows": ${JSON.stringify(feedItems)}}`;
    //return feedItems
  }


}