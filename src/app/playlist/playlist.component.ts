import { Component } from '@angular/core';
import { AppState } from '../app.service';

import { PlaylistService } from './playlist.service';
import 'rxjs/add/operator/map'


@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'playlist',  // <home></home>
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    PlaylistService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./playlist.style.scss'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './playlist.template.html'
})
export class PlaylistComponent {

  tubeApiConfig: {
    baseURL: string,
    maxResults: string,
    pageToken: string,
    part: string,
    playlistId: string,
    fields: string,
    key: string
  };
  playlist: Array<Object>;
  leftHeight: string;


  // TypeScript public modifiers
  constructor(public appState: AppState, public playlistService: PlaylistService) {

    this.tubeApiConfig = {
      baseURL: "https://content.googleapis.com/youtube/v3/playlistItems?",
      maxResults: "50",
      pageToken: "",
      part: "snippet,contentDetails",
      playlistId: "PLT702vInLOC0WSRsoqLdqYDH9lypgkxaM",
      fields: "nextPageToken,items(snippet/title, snippet/thumbnails,contentDetails(videoId,startAt,endAt))",
      key: "AIzaSyBmdqx5dDcczcPBa3PuoI2j2XVmxZiuRjo"


    }
    this.playlist = [];

 

  }

  ngOnInit() {
     this.leftHeight = window.innerHeight - document.getElementsByTagName("nav")[0].clientHeight - 10 + 'px';
    this.getFullData(this.tubeApiConfig)

  }








  getFullData(config, data: Array<Object> = []) {


    this.playlistService.getData(config).subscribe(res => {

      if (res.nextPageToken) {
        config.pageToken = res.nextPageToken;
        this.playlist = this.playlist.concat(res.items);
        return this.getFullData(config, data);
      }
      else {
        this.playlist = this.playlist.concat(res.items);
        return true;
      }
    });


  }







}
