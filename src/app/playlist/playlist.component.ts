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

  private playlist: object[];
  private leftHeight: string;

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

    this.player = YouTubePlayer('youtube__frame');

  }

  private thubnailBehaviour(playlistItem) {
    this.player.getVideoUrl().then((res) => {

      if (res.includes(playlistItem.contentDetails.videoId)) {
        this.player.getPlayerState().then((res2) => {
          //https://developers.google.com/youtube/iframe_api_reference#Functions
          switch (res2) {
            case 1: {
              playlistItem.snippet.thumbnails.overlayIcon = 'play';
              this.player.pauseVideo();
              break;
            }
            case 2:
            case 0: {
              playlistItem.snippet.thumbnails.overlayIcon = 'pause';
              this.player.playVideo();
              break;
            }
          }
        });
      } else {

        const previousItem = _.find(this.playlist, function (item) {
          return res.includes(item.contentDetails.videoId);
        });

        if (previousItem) {
          previousItem.snippet.thumbnails.overlayIcon = 'play';
        }
        playlistItem.snippet.thumbnails.overlayIcon = 'pause';

        this.player.loadVideoById(playlistItem.contentDetails.videoId);
        this.player.playVideo();
      }

    }, this);

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
