import { Component } from '@angular/core';
import { AppState } from '../app.service';

import { PlaylistService } from './playlist.service';

import * as YouTubePlayer from 'youtube-player';

import 'rxjs/add/operator/map';

import * as _ from 'underscore';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'playlist',  // <home></home>
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    PlaylistService,
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./playlist.style.scss'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './playlist.template.html'
})
export class PlaylistComponent {

  private tubeApiConfig: {
    baseURL: string,
    maxResults: string,
    pageToken: string,
    part: string,
    playlistId: string,
    fields: string,
    key: string
  };
  private player = null;
  private playListBuffer;

  private playlist: object[];
  private leftHeight: string;

  private progressValue = 0;
  private progressInterval;

  // TypeScript public modifiers
  constructor(public appState: AppState,
    public playlistService: PlaylistService) {

    this.tubeApiConfig = {
      baseURL: 'https://content.googleapis.com/youtube/v3/playlistItems?',
      maxResults: '50',
      pageToken: '',
      part: 'snippet,contentDetails',
      playlistId: 'PLT702vInLOC0WSRsoqLdqYDH9lypgkxaM',
      // tslint:disable-next-line:max-line-length
      fields: 'nextPageToken,items(snippet/title, snippet/thumbnails,contentDetails(videoId,startAt,endAt))',
      key: 'AIzaSyBmdqx5dDcczcPBa3PuoI2j2XVmxZiuRjo'
    };

    this.playlist = [];

  }

  private ngOnInit() {
    this.leftHeight = window.innerHeight -
      document.getElementsByTagName('nav')[0].clientHeight - 10 + 'px';
    this.getFullData(this.tubeApiConfig);

    this.playListBuffer = new PlaylistBuffer();

    this.player = YouTubePlayer('youtube__frame');

    this.player.on('stateChange', (event) => {
      if (this.playListBuffer.getPrevious() != -1) {
        this.playlist[this.playListBuffer.getPrevious()]['snippet'].thumbnails.overlayIcon = 'play';
      }
      switch (event.data) {
        case 1: {
          this.playlist[this.playListBuffer.getCurrent()]['snippet'].thumbnails.overlayIcon = 'pause';
          this.progressInterval = setInterval(() => {
            this.player.getCurrentTime().then((currentTime) => {
              this.player.getDuration().then((duration) => {
                this.progressValue = (currentTime / duration) * 100;
              });
               
      
            })
        
          }, 100);
          break;
        }
        case 2:
        case 0: {
          clearInterval(this.progressInterval);
          this.playlist[this.playListBuffer.getCurrent()]['snippet'].thumbnails.overlayIcon = 'play';
          break;
        }
      }
    });


    let progressBar = document.querySelector("p-progressBar");
    progressBar.addEventListener("click", (e: any) => {

      this.player.getDuration().then((duration) => {
        if (duration) {
          this.progressValue = Math.floor((e.offsetX / progressBar.clientWidth) * 100);
          this.player.seekTo(Math.floor((e.offsetX / progressBar.clientWidth) * duration));
        }

      })

    });




  }

  private thubnailBehaviour(playlistItem, index) {
    if (this.playListBuffer.getCurrent() === index) {
      this.player.getPlayerState().then((res) => {
        //https://developers.google.com/youtube/iframe_api_reference#Functions
        switch (res) {
          case 1: {
            // playlistItem.snippet.thumbnails.overlayIcon = 'play';
            this.player.pauseVideo();
            break;
          }
          case 2:
          case 0: {
            // playlistItem.snippet.thumbnails.overlayIcon = 'pause';
            this.player.playVideo();
            break;
          }
        }
      });
    }
    else {
      this.playListBuffer.add(index);
      this.player.loadVideoById(playlistItem.contentDetails.videoId);
      this.player.playVideo();
    }

  }



  private getFullData(config, data: object[] = []) {

    this.playlistService.getData(config).subscribe((res: any) => {

      if (res.nextPageToken) {
        config.pageToken = res.nextPageToken;
        this.playlist = this.playlist.concat(res.items);
        return this.getFullData(config, data);
      } else {
        this.playlist = this.playlist.concat(res.items);
        console.log(this.playlist);
        return true;
      }

    });

  }

}


class PlaylistBuffer {
  private buffer = [-1];
  constructor() { }

  public add(index) {
    if (this.buffer.length > 1) {
      this.buffer.shift();
    }
    this.buffer.push(index)
  }

  public getPrevious() {
    return this.buffer[0];
  }
  public getCurrent() {
    return this.buffer[1];
  }
}